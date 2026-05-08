---
name: pdf-summarizer
description: >
  Use when the user says: 'summarize this PDF', 'give me the key points from this document',
  'what does this paper say', 'extract the main findings', 'TL;DR this file'.
  Use when the user uploads a PDF and wants a structured summary with headings and bullet points.
  Do NOT use for: editing PDFs, converting file formats, searching within large document collections,
  or tasks unrelated to PDF content extraction and summarization.
---

# Overview

The pdf-summarizer skill extracts structured summaries from uploaded PDF documents. It identifies
the document type, extracts key sections, and presents findings in a hierarchical outline format.

## Process

1. Receive PDF file from user
2. Identify document type (academic paper, report, contract, etc.)
3. Extract title, authors, abstract/executive summary if present
4. Identify major sections and key points per section
5. Generate structured summary with:
   - Document metadata
   - Executive summary (2-3 sentences)
   - Key findings as bullet points
   - Notable quotes or statistics

## Output Format

A markdown-formatted summary with clear headings, bullet points, and optional quoted passages.
