// Group.jsx - group chat view (very similar to OneVOne)
import React from "react";
import OneVOne from "./OneVOne";

export default function Group({ conversation }) {
  // For MVP group and community behave similarly in frontend
  return <OneVOne conversation={conversation} />;
}
