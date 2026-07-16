import React from "react";
import { BookCover } from "book-cover-3d";

const sizeMap = {
  sm: { width: 160, height: 220 },
  md: { width: 200, height: 300 },
  lg: { width: 260, height: 380 },
  xl: { width: 340, height: 500 },
};

export default function BookCover3D({ imageUrl, title, size = "md" }) {
  const { width, height } = sizeMap[size] || sizeMap.md;

  return (
    <BookCover width={width} height={height} rotate={30} rotateHover={15} transitionDuration={1}>
      <img src={imageUrl} alt={title || "Book cover"} />
    </BookCover>
  );
}