export const positionsExample = [
  {
    fen: "7r/1p3k2/p1bPR3/5p2/2B2P1p/8/PP4P1/3K4 b - -",
    evals: [
      {
        pvs: [
          { cp: 58, line: "f7g7 e6e2 h8d8 e2d2 b7b5 c4e6 g7f6 e6b3 a6a5 a2a3" },
        ],
        knodes: 200973,
        depth: 39,
      },
      {
        pvs: [
          { cp: 62, line: "f7g7 e6e2 b7b5 c4b3 h8d8 e2d2 a6a5 a2a3 g7f6 d1e1" },
          {
            cp: 151,
            line: "h8d8 d1e1 a6a5 a2a3 b7b5 c4a2 c6d7 e6e7 f7g6 e1f2",
          },
        ],
        knodes: 71927,
        depth: 32,
      },
      {
        pvs: [
          { cp: 64, line: "f7g7 e6e2 g7g6 d1c2 h8d8 e2d2 g6f6 a2a3 b7b5 c4a2" },
          {
            cp: 134,
            line: "h8d8 d1e1 a6a5 a2a3 b7b5 c4b3 a5a4 b3a2 c6d7 e6h6",
          },
          {
            cp: 152,
            line: "h8f8 d1e2 f8d8 e2f2 b7b5 c4b3 a6a5 a2a3 c6d7 e6h6",
          },
        ],
        knodes: 59730,
        depth: 31,
      },
      {
        pvs: [
          { cp: 81, line: "f7g7 e6e2 b7b5 c4b3 h8d8 e2d2 a6a5 a2a3 g7f6 b3a2" },
          {
            cp: 155,
            line: "h8d8 d1e1 c6d7 e6e7 f7f6 e1f2 a6a5 a2a3 b7b5 c4a2",
          },
          {
            cp: 175,
            line: "h8f8 d1e1 b7b5 c4b3 a6a5 a2a3 f8d8 e1f2 c6d7 e6e7",
          },
          {
            cp: 222,
            line: "h8b8 d1e1 b7b5 c4b3 b8d8 d6d7 c6d7 e6a6 f7e7 a6h6",
          },
        ],
        knodes: 148627,
        depth: 28,
      },
      {
        pvs: [
          { cp: 83, line: "f7g7 e6e2 h8d8 e2d2 b7b5 c4b3 a6a5 a2a3 g7f6 d1e1" },
          {
            cp: 160,
            line: "h8d8 d1e1 b7b5 c4b3 f7g7 e1f2 a6a5 a2a3 c6d7 e6e7",
          },
          {
            cp: 195,
            line: "h8f8 d1e1 a6a5 a2a3 f8d8 e1f2 b7b5 c4b3 c6d7 e6h6",
          },
          {
            cp: 229,
            line: "h8a8 d1e1 b7b5 c4b3 a8d8 d6d7 c6d7 e6a6 f7e7 a6h6",
          },
          {
            cp: 232,
            line: "h8b8 d1e1 b7b5 c4b3 b8f8 d6d7 c6d7 e6a6 f7e7 a6h6",
          },
        ],
        knodes: 255389,
        depth: 26,
      },
    ],
  },
  {
    fen: "8/4r3/2R2pk1/6pp/3P4/6P1/5K1P/8 b - -",
    evals: [
      {
        pvs: [
          { cp: 0, line: "e7a7 f2e3 a7a3 e3e4 a3a2 h2h4 g5h4 g3h4 a2h2 c6c1" },
          { cp: 0, line: "e7b7 f2e3 b7b3 e3e4 b3b2 h2h4 g5h4 g3h4 b2h2 c6c1" },
        ],
        knodes: 491568,
        depth: 58,
      },
      {
        pvs: [
          { cp: 0, line: "e7e4 h2h4 g5h4 g3h4 e4d4 f2g3 d4g4 g3h3 g4a4 c6c8" },
          { cp: 0, line: "g6f5 c6c5 f5e4 h2h4 e4d4 c5f5 e7e5 f5f6 g5g4 f6d6" },
          { cp: 0, line: "e7a7 f2e3 a7a1 c6c2 g6f5 e3d3 a1d1 d3e3 d1e1 e3d3" },
          { cp: 0, line: "e7b7 f2e3 b7b1 c6c2 g6f5 c2f2 f5e6 e3d3 b1a1 d3c4" },
          { cp: 0, line: "e7d7 f2e3 d7e7 e3d3 e7e1 c6c2 e1d1 c2d2 d1d2 d3d2" },
        ],
        knodes: 1176702,
        depth: 57,
      },
    ],
  },
  {
    fen: "6k1/6p1/8/4K3/4NN2/8/8/8 w - -",
    evals: [
      {
        pvs: [
          {
            mate: 18,
            line: "e4d6 g8h7 e5f5 g7g5 f4h5 h7h6 h5g3 h6g7 f5e6 g7f8",
          },
        ],
        knodes: 4300494,
        depth: 87,
      },
      {
        pvs: [
          {
            mate: 20,
            line: "e4g5 g8f8 f4g6 f8e8 e5d6 e8d8 g6e7 g7g6 e7c6 d8c8",
          },
          {
            mate: 24,
            line: "f4g6 g8f7 e5f5 f7e8 f5e6 e8d8 e6d6 d8c8 d6c6 c8d8",
          },
        ],
        knodes: 265367,
        depth: 59,
      },
      {
        pvs: [
          {
            mate: 16,
            line: "e5e6 g7g5 f4h5 g8f8 e4d6 g5g4 h5g3 f8g8 e6f5 g8g7",
          },
          {
            mate: 18,
            line: "e4d6 g8h7 e5e6 g7g5 f4h5 h7h6 h5g3 h6g7 e6e7 g7g6",
          },
          {
            mate: 20,
            line: "e4g5 g8f8 f4g6 f8e8 e5d6 e8d8 g6e7 g7g6 e7c6 d8c8",
          },
        ],
        knodes: 92299,
        depth: 50,
      },
      {
        pvs: [
          {
            mate: 16,
            line: "e5e6 g8f8 e4d6 f8g8 e6f5 g7g5 f4h5 g5g4 h5g3 g8g7",
          },
          {
            mate: 18,
            line: "e4d6 g8h7 e5f5 g7g5 f4h5 h7h6 h5g3 h6g7 f5e6 g7f8",
          },
          {
            mate: 20,
            line: "e4g5 g8f8 e5d6 f8e8 f4d5 e8d8 d5e7 g7g6 e7c6 d8c8",
          },
          {
            mate: 24,
            line: "f4g6 g8f7 e5f5 f7e8 f5e6 e8d8 e6d6 d8c8 d6c6 c8d8",
          },
          {
            mate: 38,
            line: "f4d5 g8f7 e4g5 f7g6 e5f4 g6h6 f4f5 h6h5 d5f4 h5h4",
          },
        ],
        knodes: 53922,
        depth: 41,
      },
    ],
  },
  {
    fen: "r1b2rk1/1p2bppp/p1nppn2/q7/2P1P3/N1N5/PP2BPPP/R1BQ1RK1 w - -",
    evals: [
      {
        pvs: [
          { cp: 30, line: "f1e1 c8d7 c1e3 d6d5 c4d5 e7a3 b2a3 a5c3 d5c6 d7c6" },
          { cp: 26, line: "h2h3 f8d8 c1e3 h7h6 d1c1 c8d7 c1d2 c6b4 a1c1 a8c8" },
          { cp: 24, line: "c1e3 f8d8 h2h3 h7h6 d1c1 f6d7 f1d1 d7c5 a3c2 e7f6" },
          { cp: 21, line: "d1d2 c8d7 f1d1 h7h6 h2h3 f8d8 d2e1 c6e5 c1d2 a5c7" },
          { cp: 20, line: "a3c2 f8d8 c1d2 a5c7 c2e3 b7b6 d2e1 c6e5 a1c1 c8b7" },
        ],
        knodes: 72553,
        depth: 25,
      },
    ],
  },
  {
    fen: "6k1/4Rppp/8/8/8/8/5PPP/6K1 w - -",
    evals: [
      { pvs: [{ mate: 1, line: "e7e8" }], knodes: 154, depth: 99 },
      {
        pvs: [
          { mate: 1, line: "e7e8" },
          {
            mate: 43,
            line: "g1f1 g7g6 f1e2 g8f8 e7a7 f8g7 e2f3 g6g5 f3e4 g7g6",
          },
        ],
        knodes: 265478,
        depth: 41,
      },
      {
        pvs: [
          { mate: 1, line: "e7e8" },
          {
            mate: 44,
            line: "g1f1 g8f8 e7c7 g7g6 f1e2 f8g7 e2f3 g7f6 f3e4 f6e6",
          },
          {
            mate: 48,
            line: "e7c7 h7h6 g1f1 g7g6 f1e2 g8g7 e2e3 g7f6 e3e4 f6e6",
          },
        ],
        knodes: 310731,
        depth: 40,
      },
      {
        pvs: [
          { mate: 1, line: "e7e8" },
          {
            cp: 844,
            line: "g1f1 g7g5 e7c7 g8g7 f1e2 g7g6 e2e3 f7f5 c7c6 g6f7",
          },
          {
            cp: 838,
            line: "e7c7 g7g5 g1f1 h7h6 f1e2 f7f5 e2e3 g8f8 h2h3 f8e8",
          },
          {
            cp: 801,
            line: "h2h3 g7g5 g1f1 g8g7 f1e2 g7f6 e7e8 f6f5 e2f3 h7h5",
          },
          {
            cp: 796,
            line: "f2f3 g7g6 e7e8 g8g7 g1f2 g7f6 f2e3 f6f5 e8a8 f5e5",
          },
        ],
        knodes: 86239,
        depth: 25,
      },
    ],
  },
  {
    fen: "6k1/6p1/6N1/4K3/4N3/8/8/8 b - -",
    evals: [
      {
        pvs: [
          {
            mate: 27,
            line: "g8h7 e5f5 h7h6 e4g3 h6h7 f5g5 h7g8 g3e4 g8f7 g5f5",
          },
        ],
        knodes: 64636,
        depth: 62,
      },
      {
        pvs: [
          {
            mate: 27,
            line: "g8h7 e5f5 h7h6 e4g3 h6h7 f5g5 h7g8 g3e4 g8f7 g5f5",
          },
          {
            mate: 23,
            line: "g8f7 e5f5 f7e8 f5e6 e8d8 e6d6 d8c8 e4c5 c8d8 c5e6",
          },
        ],
        knodes: 748,
        depth: 41,
      },
    ],
  },
];
