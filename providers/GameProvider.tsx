import {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import {
  GameState,
  gameReducer,
  getGuessOutcome,
  getStoredOutcome,
  GuessOutcome,
  INITIAL_GAME_STATE,
  toGuessResult,
} from '@/utils/gameMachine';
import {
  applyGuessResult,
  createInitialGameSession,
  GameMode,
  GameSession,
  selectNextPosition,
} from '@/utils/gameSession';
import {
  clearGameSession,
  loadGameSession,
  saveGameSession,
} from '@/utils/gameStorage';
import {
  DEFAULT_DEV_SETTINGS,
  DevSettings,
  getEffectiveRating,
} from '@/utils/devSettings';
import { loadDevSettings, saveDevSettings } from '@/utils/devSettingsStorage';
import {
  loadPositionByRef,
  loadPositionIndex,
  prefetchPosition,
} from '@/utils/positionService';
import { STARTING_RATING } from '@/utils/rating';
import { getSessionStats, SessionStats } from '@/utils/stats';

export type { GameMode };

interface GameContextValue extends GameState {
  /** The scored answer for the position on screen, `null` while unanswered. */
  outcome: GuessOutcome | null;
  /** `null` only before the first load finishes. */
  stats: SessionStats | null;
  mode: GameMode;
  setMode: (mode: GameMode) => void;
  devSettings: DevSettings;
  setGuess: (guess: number) => void;
  submit: () => void;
  finishCue: () => void;
  openReview: () => void;
  setReviewStep: (step: number) => void;
  next: () => void;
  retry: () => void;
  resetProgress: () => Promise<void>;
  setDevSettings: (settings: DevSettings) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

/**
 * The game lives above the router so the home and profile screens read the
 * same session the board is playing, and leaving the board mid-guess does not
 * throw the position away.
 */
export const GameProvider: FC<PropsWithChildren> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_GAME_STATE);
  const [devSettings, setDevSettingsState] =
    useState<DevSettings>(DEFAULT_DEV_SETTINGS);
  const [reloadToken, setReloadToken] = useState(0);

  /** Selected while the player reads the result, so "Next" feels instant. */
  const pendingSession = useRef<GameSession | null>(null);

  const { phase, session, position, guess, index } = state;

  useEffect(() => {
    let isActive = true;

    async function initialize() {
      try {
        const [loadedIndex, loadedDevSettings] = await Promise.all([
          loadPositionIndex(),
          loadDevSettings(),
        ]);

        if (!isActive) return;

        setDevSettingsState(loadedDevSettings);

        const savedSession = await loadGameSession(
          loadedIndex.manifest.files.length,
          (fileIndex) => loadedIndex.manifest.counts[fileIndex],
        );

        if (!isActive) return;

        dispatch({
          type: 'initialized',
          index: loadedIndex,
          session:
            savedSession ??
            createInitialGameSession(
              loadedIndex,
              getEffectiveRating(STARTING_RATING, loadedDevSettings),
            ),
        });
      } catch (error) {
        if (!isActive) return;

        dispatch({
          type: 'failed',
          message:
            error instanceof Error ? error.message : 'Unknown error occurred.',
        });
      }
    }

    void initialize();

    return () => {
      isActive = false;
    };
  }, [reloadToken]);

  const currentRef = session?.currentPositionRef;

  useEffect(() => {
    if (!currentRef) {
      return;
    }

    let isActive = true;

    loadPositionByRef(currentRef)
      .then((loaded) => {
        if (isActive) {
          dispatch({
            type: 'positionLoaded',
            position: loaded,
            ref: currentRef,
          });
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          dispatch({
            type: 'failed',
            message:
              error instanceof Error
                ? error.message
                : 'Could not load the position.',
          });
        }
      });

    return () => {
      isActive = false;
    };
  }, [currentRef]);

  useEffect(() => {
    if (session && phase !== 'loading' && phase !== 'error') {
      void saveGameSession(session);
    }
  }, [phase, session]);

  // The answer is scored into the session when it is locked in, so the result
  // screen reads it back rather than recomputing it against a rating that has
  // meanwhile moved.
  const outcome = useMemo(
    () => getStoredOutcome(position, session?.lastResult ?? null),
    [position, session],
  );

  const submit = useCallback(() => {
    if (!session || !position || phase !== 'guessing') {
      return;
    }

    const scored = getGuessOutcome(
      position,
      guess,
      session.rating,
      session.currentPositionRating,
    );

    if (!scored) {
      return;
    }

    dispatch({
      type: 'submitted',
      session: applyGuessResult(
        session,
        toGuessResult(guess, scored, session.mode),
      ),
    });
  }, [guess, phase, position, session]);

  const buildNextSession = useCallback(() => {
    if (!session || !index || !session.lastResult) {
      return null;
    }

    return selectNextPosition(
      session,
      index,
      getEffectiveRating(session.rating, devSettings),
    );
  }, [devSettings, index, session]);

  // Choosing the next position up front lets it download while the result is
  // still being read.
  useEffect(() => {
    if (phase !== 'cue' && phase !== 'result') {
      return;
    }

    const next = buildNextSession();

    if (next) {
      pendingSession.current = next;
      prefetchPosition(next.currentPositionRef);
    }
  }, [buildNextSession, phase]);

  const setDevSettings = useCallback((newSettings: DevSettings) => {
    setDevSettingsState(newSettings);
    pendingSession.current = null;
    void saveDevSettings(newSettings);
  }, []);

  // The prefetched session was built with the old mode baked into it.
  const setMode = useCallback((mode: GameMode) => {
    pendingSession.current = null;
    dispatch({ type: 'modeChanged', mode });
  }, []);

  const next = useCallback(() => {
    const nextSession = pendingSession.current ?? buildNextSession();

    if (!nextSession) {
      return;
    }

    pendingSession.current = null;
    dispatch({ type: 'advanced', session: nextSession });
  }, [buildNextSession]);

  const resetProgress = useCallback(async () => {
    pendingSession.current = null;
    await clearGameSession();
    dispatch({ type: 'retrying' });
    setReloadToken((token) => token + 1);
  }, []);

  const retry = useCallback(() => {
    dispatch({ type: 'retrying' });
    setReloadToken((token) => token + 1);
  }, []);

  const value = useMemo<GameContextValue>(
    () => ({
      ...state,
      outcome,
      stats: session ? getSessionStats(session) : null,
      mode: session?.mode ?? 'rated',
      setMode,
      devSettings,
      setGuess: (value: number) =>
        dispatch({ type: 'guessChanged', guess: value }),
      submit,
      finishCue: () => dispatch({ type: 'cueFinished' }),
      openReview: () => dispatch({ type: 'reviewOpened' }),
      setReviewStep: (step: number) =>
        dispatch({ type: 'reviewStepChanged', step }),
      next,
      retry,
      resetProgress,
      setDevSettings,
    }),
    [
      devSettings,
      next,
      outcome,
      resetProgress,
      retry,
      session,
      setDevSettings,
      setMode,
      state,
      submit,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export function useGame(): GameContextValue {
  const context = useContext(GameContext);

  if (!context) {
    throw new Error('useGame must be used inside a GameProvider');
  }

  return context;
}
