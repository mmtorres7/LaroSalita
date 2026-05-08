// ─────────────────────────────────────────
//  HIBLA — Puzzle Bank
//
//  Each puzzle:
//    theme   — the category clue shown to the player
//    cols    — grid width
//    rows    — grid height
//    words[] — words hidden in the grid (one is the PANGKAT / theme word,
//              marked with isTheme: true; the rest are regular finds)
//    grid    — flat string of letters, left-to-right, top-to-bottom
//    placed  — for each word, the list of [row, col] cell coords that
//              spell it out (used for validation & highlighting)
// ─────────────────────────────────────────

const PUZZLES = [
  {
    id: 0,
    theme: "Bahagi ng Katawan",
    cols: 6,
    rows: 6,
    // Grid (6×6):
    //   U L O N G A
    //   K A M A Y B
    //   I L I H I N
    //   P U S O L A
    //   M A T A A S
    //   N O O P I L
    grid: "ULONGAKAMAYBILINIPUSOLAMATAASNOOPIL",
    words: [
      {
        word: "ULONG",
        isTheme: false,
        cells: [[0,0],[0,1],[0,2],[0,3],[0,4]],
      },
      {
        word: "KAMAY",
        isTheme: false,
        cells: [[1,0],[1,1],[1,2],[1,3],[1,4]],
      },
      {
        word: "PUSO",
        isTheme: false,
        cells: [[3,0],[3,1],[3,2],[3,3]],
      },
      {
        word: "MATA",
        isTheme: false,
        cells: [[4,0],[4,1],[4,2],[4,3]],
      },
      {
        word: "ILONG",
        isTheme: false,
        cells: [[2,0],[1,1],[0,2],[0,3],[0,4]],
      },
      {
        word: "KATAWAN",
        isTheme: true,
        cells: [[1,0],[0,0],[3,0],[0,3],[1,3],[0,4],[2,3]],
      },
    ],
  },
  {
    id: 1,
    theme: "Pagkain",
    cols: 7,
    rows: 6,
    // Grid (7×6):
    //   A D O B O X Y
    //   S I N I G A N
    //   B I B I N G K
    //   A P A N D E S
    //   L E C H O N A
    //   K A R E K A R
    grid: "ADOBOXYSINIGANBBIBINGKAAPANDESLECHONAKAREKAR",
    words: [
      {
        word: "ADOBO",
        isTheme: false,
        cells: [[0,0],[0,1],[0,2],[0,3],[0,4]],
      },
      {
        word: "SINIGANG",
        isTheme: false,
        cells: [[1,0],[1,1],[1,2],[1,3],[1,4],[1,5],[1,6]],
      },
      {
        word: "BIBINGKA",
        isTheme: false,
        cells: [[2,0],[2,1],[2,2],[2,3],[2,4],[2,5],[2,6],[3,0]],
      },
      {
        word: "LECHON",
        isTheme: false,
        cells: [[4,0],[4,1],[4,2],[4,3],[4,4],[4,5]],
      },
      {
        word: "KARE",
        isTheme: false,
        cells: [[5,0],[5,1],[5,2],[5,3]],
      },
      {
        word: "PAGKAIN",
        isTheme: true,
        cells: [[3,1],[0,0],[2,0],[1,0],[0,3],[3,3],[2,4]],
      },
    ],
  },
  {
    id: 2,
    theme: "Hayop",
    cols: 6,
    rows: 6,
    // Grid (6×6):
    //   A S O X Y Z
    //   P U S A B C
    //   I S D A D E
    //   B A K A F G
    //   M A N O K H
    //   K A L A W I
    grid: "ASOXYZPUSABCISDADEBAKAFGMANOKHAKALAWI",
    words: [
      {
        word: "ASO",
        isTheme: false,
        cells: [[0,0],[0,1],[0,2]],
      },
      {
        word: "PUSA",
        isTheme: false,
        cells: [[1,0],[1,1],[1,2],[1,3]],
      },
      {
        word: "ISDA",
        isTheme: false,
        cells: [[2,0],[2,1],[2,2],[2,3]],
      },
      {
        word: "BAKA",
        isTheme: false,
        cells: [[3,0],[3,1],[3,2],[3,3]],
      },
      {
        word: "MANOK",
        isTheme: false,
        cells: [[4,0],[4,1],[4,2],[4,3],[4,4]],
      },
      {
        word: "HAYOP",
        isTheme: true,
        cells: [[4,4],[0,0],[3,0],[0,2],[3,1]],
      },
    ],
  },
  {
    id: 3,
    theme: "Kulay",
    cols: 6,
    rows: 6,
    // Grid (6×6):
    //   P U L A X Y
    //   B E R D E Z
    //   A S U L A B
    //   D I L A W C
    //   I T I M D E
    //   P U T I F G
    grid: "PULAXYBERDEZASULABDILAW CITIMDEPURIFG",
    words: [
      {
        word: "PULA",
        isTheme: false,
        cells: [[0,0],[0,1],[0,2],[0,3]],
      },
      {
        word: "BERDE",
        isTheme: false,
        cells: [[1,0],[1,1],[1,2],[1,3],[1,4]],
      },
      {
        word: "ASUL",
        isTheme: false,
        cells: [[2,0],[2,1],[2,2],[2,3]],
      },
      {
        word: "DILAW",
        isTheme: false,
        cells: [[3,0],[3,1],[3,2],[3,3],[3,4]],
      },
      {
        word: "ITIM",
        isTheme: false,
        cells: [[4,0],[4,1],[4,2],[4,3]],
      },
      {
        word: "KULAY",
        isTheme: true,
        cells: [[1,0],[0,1],[2,3],[0,0],[3,4]],
      },
    ],
  },
];

export default PUZZLES;