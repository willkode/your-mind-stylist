import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";

export default function Library() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(createPageUrl("ClientPortal"), { replace: true });
  }, []);
  return null;
}