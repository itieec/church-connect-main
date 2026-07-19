# Chapter 1 — Vision & Problem Definition

**Source:** Link 1 (pre-cutoff) — https://chatgpt.com/share/6a54d9c0-23d4-83ea-b8d6-6e3675729fbd  
**Status:** Approved (first phase)  
**Continued in:** Link 2 only for later chapters; this chapter is not redefined there.

## Vision

Build **IEEC YA Connect** as a centralized Young Adult ministry management platform that can later scale toward denomination-wide use.

## Problem

Ministry work is fragmented across people, follow-up, teams, attendance, and leadership processes. The platform must manage **people and ministry operations** in one system.

## Goal

Shepherd people from **newcomer → member → minister / leadership**, with clear responsibility, history, and access control.

## Foundation checklist (completed in link 1)

- Vision  
- Problem definition  
- Organization structure  
- Ministry journey  
- Design principles  

## Design principles (approved direction)

- People are the center of the system  
- Everything is configurable  
- Everything has history  
- Soft delete by default  
- Optional lifecycle / time control  
- Separate technical authority from ministry authority  
- Separate oversight from team membership  
- Roles are templates  
- Individual permission overrides  
- Least-privilege / default deny  
- Audit sensitive changes  

## Technical direction (from phase 1 framing)

**Web + Mobile** clients sharing Firebase (Auth, Firestore, later Functions/Storage as needed).  
**Web:** React + TypeScript. **Mobile:** React Native (Expo) + TypeScript. **Not Flutter.** Mobile is a first-class app surface, not a deferred add-on.

## Note

Detailed org hierarchy and multi-org expansion continue in later architecture docs; chapter 1 establishes *why* the platform exists and the non-negotiable design principles.
