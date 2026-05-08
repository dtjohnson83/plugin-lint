---
name: email-drafter
description: >
  Use when the user says: 'write me an email', 'draft a message to', 'help me reply to this email',
  'compose a professional email', 'write a follow-up email'.
  Use when the user needs to compose or reply to business emails, follow-ups, or formal correspondence.
  Do NOT use for: writing social media posts, SMS messages, internal Slack messages,
  generating bulk marketing emails, or any non-email written communication.
---

# Overview

The email-drafter skill composes professional emails based on user-provided context, recipient,
and desired tone. It handles everything from cold outreach to internal memos.

## Process

1. Gather context: recipient, purpose, desired tone, any prior thread if replying
2. Identify email type: cold outreach, reply, follow-up, internal, client-facing
3. Draft subject line with appropriate specificity
4. Write email body following professional structure:
   - Opening line with context
   - Body paragraphs with clear ask or information
   - Closing with call to action
5. Offer subject line alternatives if appropriate
6. Ask user to review and confirm before finalizing

## Output Format

Full email including subject line, salutation, body, and signature placeholder.
