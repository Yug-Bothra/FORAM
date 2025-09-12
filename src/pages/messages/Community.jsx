// Community.jsx - community chat / larger audience
import React from "react";
import OneVOne from "./OneVOne";

export default function Community({ conversation }) {
  return <OneVOne conversation={conversation} />;
}
