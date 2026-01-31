"use client";

import React, { Fragment } from "react";

interface LinkifyProps {
  children: string | null | undefined;
  className?: string;
}

// URL regex that matches http(s):// URLs and common TLDs
const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+|www\.[^\s<>"{}|\\^`[\]]+\.[a-z]{2,}/gi;

/**
 * Renders text with URLs converted to clickable links.
 * Links open in a new tab with security attributes.
 */
export function Linkify({ children, className }: LinkifyProps) {
  if (!children) return null;

  const parts: (string | React.ReactElement)[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Reset regex state
  URL_REGEX.lastIndex = 0;

  while ((match = URL_REGEX.exec(children)) !== null) {
    // Add text before the URL
    if (match.index > lastIndex) {
      parts.push(children.slice(lastIndex, match.index));
    }

    const url = match[0];
    // Ensure URL has protocol for href
    const href = url.startsWith("http") ? url : `https://${url}`;

    parts.push(
      <a
        key={match.index}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline hover:text-primary/80 break-all"
        onClick={(e) => e.stopPropagation()}
      >
        {url}
      </a>
    );

    lastIndex = match.index + url.length;
  }

  // Add remaining text after last URL
  if (lastIndex < children.length) {
    parts.push(children.slice(lastIndex));
  }

  // If no URLs found, return plain text
  if (parts.length === 0) {
    return <span className={className}>{children}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, i) => (
        <Fragment key={i}>{part}</Fragment>
      ))}
    </span>
  );
}
