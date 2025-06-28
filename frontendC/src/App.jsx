import React from 'react'
import { Chess } from "chess.js";
const chess = new Chess();

import { io } from "socket.io-client";
import { useState } from 'react';
const socket = io(); // Vite proxy will route this to localhost:5000
import { useEffect } from 'react';

const App = () => {

  useEffect(() => {
    socket.on("playerRole", (role) => {
      setPlayerRole(role);
      setChessBoard(chess.fen()); // Trigger re-render
    });
    socket.on("spectatorRole", (role) => {
      setPlayerRole(null);
      setChessBoard(chess.fen()); // Trigger re-render
    });

    socket.on("boardState", (fen) => {
      chess.load(fen);
      setChessBoard(fen);

    });

    socket.on("move", (move) => {
      chess.move(move);
      setChessBoard(chess.fen()); // Trigger re-render
    })

    socket.on("invalidMove", (move) => {
      console.log("Invalid move:", move);
      // Handle invalid move feedback
    });

    // ... your socket listeners
    return () => {
      socket.off("playerRole");
      socket.off("spectatorRole");
      socket.off("boardState");
      socket.off("move");
        socket.off("invalidMove"); // ❌ Missing this line
    };


  }, []);

const [chessBoard, setChessBoard] = useState(chess.fen()); // ✅ Starting chess position
  const [draggedPiece, setDraggedPiece] = useState();
  const [sourceSquare, setSourceSquare] = useState();
  const [playerRole, setPlayerRole] = useState();

  const render = function () {
    const board = chess.board();
    // Return a React JSX grid for the chess board

    console.log("Current player role:", playerRole); // Debug log
    return (
      <div className="board grid grid-cols-8 grid-rows-8 w-full h-full">
        {board.map((row, rowIdx) =>
          row.map((piece, colIdx) => {
            const isLight = (rowIdx + colIdx) % 2 === 1;
            const squareColor = isLight ? "bg-green-200" : "bg-green-700";

            // Create the piece element with drag logic
            let pieceElement = null;
            if (piece && piece.type) {
              // Only allow dragging if the player's role matches the piece color
              const isDraggable = (playerRole === piece.color);
              pieceElement = (
                <span
                  style={{ fontSize: 32 }}
                  draggable={isDraggable}
                  onDragStart={e => {
                    if (isDraggable) {
                      setDraggedPiece(piece);
                      setSourceSquare({ row: rowIdx, col: colIdx });
                      e.dataTransfer.setData("text/plain", `${rowIdx}-${colIdx}`);
                    } else {
                      e.preventDefault();
                    }
                  }}
                  onDragEnd={e => {
                    setDraggedPiece(null);
                    setSourceSquare(null);
                  }}
                >
                  {getPieceUnicode(piece.color === "w" ? piece.type.toUpperCase() : piece.type)}
                </span>
              );
            }
            return (
              <div
                key={`${rowIdx}-${colIdx}`}
                className={`w-full h-full flex items-center justify-center ${squareColor}`}
                style={{ aspectRatio: 1 }}
                data-row={rowIdx}
                data-col={colIdx}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  if (draggedPiece) {
                    const targetSource = {
                      row: parseInt(e.currentTarget.dataset.row),
                      col: parseInt(e.currentTarget.dataset.col)
                    };
                    // You can now use targetSource for move logic
                    // Example: handleMove(sourceSquare, targetSource)
                    handleMove(sourceSquare, targetSource);
                  }
                }}
              >
                {pieceElement}
              </div>

            );
          })
        )}
      </div>
    );
  };

  const handleMove = function (source, target) {
    if (!source || !target) return;
    // Convert row/col to chess.js square notation (e.g., {row:6,col:4} => 'e2')
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const sourceSquare = files[source.col] + (8 - source.row);
    const targetSquare = files[target.col] + (8 - target.row);
    // Try to make the move
    // REMOVE THIS LINE: const move = chess.move({ from: sourceSquare, to: targetSquare });
    // Just emit to backend:
    socket.emit("move", { from: sourceSquare, to: targetSquare });
  };

  const getPieceUnicode = function (piece) {
    const pieceMap = {
      'K': '♔', // White King
      'Q': '♕', // White Queen
      'R': '♖', // White Rook
      'B': '♗', // White Bishop
      'N': '♘', // White Knight
      'P': '♙', // White Pawn
      'k': '♚', // Black King
      'q': '♛', // Black Queen
      'r': '♜', // Black Rook
      'b': '♝', // Black Bishop
      'n': '♞', // Black Knight
      'p': '♟', // Black Pawn
    };
    return pieceMap[piece] || '';
  };


  return (
    <div>
      <div className="w-full h-screen bg-zinc-900 flex justify-center items-center">
        <div className="w-96 h-96 bg-white rounded-lg shadow-md">
          {render()}
        </div>
      </div>
    </div>
  )
}

export default App
