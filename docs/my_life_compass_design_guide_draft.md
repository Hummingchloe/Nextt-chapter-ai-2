# My Life Compass — Design Guide Draft

Created: 2026-06-19  
Status: Working draft  
Purpose: Give designers, frontend agents, and product collaborators a shared visual and UX direction for the My Life Compass website/app redesign.

## 1. Product Identity

### Service name
My Life Compass

### Working one-liner
My Life Compass helps people who feel unsure about their next work or life direction clarify it through daily conversation, reflection, and small next actions.

### Plain Korean explanation
My Life Compass는 "내가 다음에 어떤 일을 할 수 있을까"가 막막한 사람이 대화를 쌓아가면서 자신의 방향을 조금씩 더 선명하게 만드는 서비스다.

### Desired impression
- Warm, calm, and trustworthy.
- Professional enough for career and work decisions.
- Personal enough to feel like a daily companion.
- Clear and action-oriented, not abstract or mystical.
- Quietly premium, but not cold or corporate.

### Avoid
- Fortune-telling, astrology, tarot, or overly mystical compass imagery.
- Generic HR SaaS dashboards.
- Overly playful productivity app styling.
- Heavy AI jargon or technical engine language.
- Dark, dense, intimidating data-product visuals.

## 2. Target User Context

### Primary user situation
The user has experience, skills, or latent potential, but does not yet know what direction to take next. They may be considering a career transition, a personal project, solo business, portfolio work, or a new offer to the market.

### Emotional state when arriving
- "I have done things, but I cannot organize them clearly."
- "I know I need to move, but I do not know what the next step is."
- "I want advice that understands my context, not generic motivation."
- "I want to see progress over time."

### Emotional state after using the product
- "My direction is a little clearer."
- "I can see what I should try today."
- "My past conversations are becoming useful."
- "The system remembers me and gets better."

## 3. Product Structure

### Primary navigation
The product should be organized around three main surfaces:

1. Chat
2. Dashboard
3. Roadmap

Recommended navigation framing:
- Chat should feel like the central daily entrance.
- Dashboard should feel like the current-state view.
- Roadmap should feel like the long-term journey view.

If there are three navigation tabs, placing Chat in the center is a strong option because it is the daily loop entry point.

### New user flow
`Onboarding -> First Report -> Chat`

The first-time flow should help the user reveal context through structured questions and, later, optional resume/self-introduction input. The first report becomes the first milestone in the user's journey.

### Returning user loop
`Chat -> Dashboard -> Action / Record -> Report Trigger -> Roadmap -> Chat`

The returning user experience should feel like a loop:
- The user returns to Chat.
- The product asks about the day or recent progress.
- The conversation updates the user's state.
- Dashboard shows current direction, actions, and recommendations.
- When enough meaningful records accumulate, a new report becomes a Roadmap milestone.

### Implementation state legend
Use a simple internal state legend when discussing scope:
- Green: already working or mostly working.
- Yellow: existing code or concept exists, but needs reconnecting.
- Purple: needs new design or new implementation.

This color/status legend is useful for internal planning, but should not be exposed as a user-facing concept.

## 4. Screen Purpose

### Landing
Goal: Explain within five seconds who this is for and why it matters.

The landing page should answer:
- Who is this for?
- What problem does it solve?
- What happens after I start?
- Why should I trust it with personal direction?

Avoid turning the landing page into a feature list. It should introduce the product promise clearly and then lead into the first action.

### Onboarding
Goal: Help the user show enough context for a meaningful first report.

Onboarding should feel structured but not bureaucratic. It should ask useful questions, not feel like a job application.

### Chat
Goal: Become the daily input and coaching space.

Chat should feel like:
- The first place a returning user lands.
- A place to talk about today, decisions, blockers, market signals, and small actions.
- A place where the product can notify the user that new insight or a report is available.

### Dashboard
Goal: Show the user's current position.

Dashboard should show:
- Current direction.
- Today's suggested action.
- Recent records.
- Relevant content or market signals.
- Skills or strengths.
- Consistency or progress over time.

The dashboard should avoid internal engine explanations. It should show useful results.

### Roadmap
Goal: Show that the user's direction is becoming clearer over time.

Roadmap should visualize:
- First report as the first milestone.
- Later reports as new milestones.
- Meaningful changes compared with earlier states.
- A sense of accumulating clarity, not just a timeline of app events.

### Report
Goal: Turn accumulated conversation into a meaningful snapshot.

Reports should summarize:
- What the product currently understands about the user.
- Strengths and repeated signals.
- Possible direction.
- Suggested next actions.
- What has changed since the last report.

## 5. Visual Direction

### Core metaphor
Compass, not horoscope.

The compass should communicate direction, clarity, and movement. It should not imply destiny, prediction, or magical certainty.

### Secondary metaphor
Journey / roadmap.

The product should show progress as accumulated clarity over time. Milestones should feel earned through records, actions, and reflection.

### Bead / factor visualization
The bead compass concept can work well if each factor is clearly explained on hover or tap.

Candidate factor language needs product review:
- Records / Context
- Direction
- Market signal
- Action
- Skills

Notes:
- "Goal" may be too fixed if the system is still discovering direction.
- "Market" may be too abstract; consider "market signal", "outside signal", "opportunity signal", or "market fit signal".
- "Skill" is intuitive if it represents what the user can credibly do.

### Mood
Recommended mood keywords:
- Clear
- Reflective
- Alive
- Focused
- Warm professional
- Daily-use friendly

Avoid:
- Heavy gradients.
- Futuristic AI dashboards.
- Overly decorative cards.
- Spiritual wellness imagery.
- Corporate blue SaaS sameness.

## 6. Copy Tone

### User-facing language
Use:
- Direction
- Record
- Today's action
- Next step
- Strength
- Signal
- Progress
- More clear / clearer
- Recent context

Avoid:
- Ontology
- Vector
- H/M
- Alignment score
- Bead convergence
- Internal model terms
- Abstract AI system explanations

### Example tone
Good:
- "Your direction is becoming clearer."
- "Here is one action to try today."
- "This recommendation is based on your recent records."
- "A new report is ready on your roadmap."

Avoid:
- "Your ontology vector has converged."
- "Alignment increased by 7%."
- "The proposal engine calculated an offer."
- "Your H abstraction has stabilized."

### Korean tone
Use natural Korean that feels calm and useful:
- "오늘 해볼 일"
- "최근 기록"
- "방향이 조금 더 선명해졌어요"
- "지금 보이는 가능성"
- "내 강점"
- "밖에서 들어온 신호"

Avoid:
- "정렬도"
- "온톨로지"
- "벡터"
- "구슬 수렴"
- "제안 엔진"

## 7. Component Requirements

### Global navigation
Needed states:
- Chat
- Dashboard
- Roadmap
- Active tab
- Disabled or coming-soon state, if Roadmap is not yet live

### Chat
Needed components:
- Assistant message
- User message
- Starter prompts
- Input field
- Send / recording state
- Suggested action inside chat
- Report-ready notification
- Empty state for first visit

### Dashboard
Needed components:
- Compass visualization
- Current direction summary
- Today's action card
- Recent records list
- Content recommendation card
- Skills / strengths section
- Progress or streak indicator
- Empty states when the user has not provided enough context

### Roadmap
Needed components:
- Milestone card
- First report milestone
- Later report milestone
- Locked / future milestone
- Comparison between reports
- Notification that a new milestone was added

### Report
Needed components:
- Summary header
- Strengths
- Direction hypothesis
- Evidence from records
- Suggested next steps
- Change since previous report

### Tooltip / hover areas
Use tooltips for compact visual factors, especially the bead compass. Tooltips should explain what the factor means in user language.

## 8. Design Constraints

### Current implementation reality
The current product has Chat and Dashboard working most clearly. Onboarding and first report need reconnection. Roadmap, second report, report triggers, and chat history need new implementation.

### Redesign priority
The design guide should support both:
- Near-term visual polish of existing Chat and Dashboard.
- Longer-term OS structure with Onboarding, Reports, and Roadmap.

### Engineering constraints
When implementing changes:
- Keep view and logic separated.
- Prefer small, testable changes.
- Avoid schema or storage changes unless explicitly planned.
- Pass tests before merge.
- Verify production after deployment.

### Accessibility
Minimum requirements:
- Readable font sizes on mobile.
- Strong contrast for text.
- Touch targets large enough for mobile.
- No text overlap in cards or buttons.
- Tooltips should have mobile alternatives.

## 9. Reference Resources To Collect

### Must provide first
- Final service name: My Life Compass.
- One-sentence product definition.
- Primary target user.
- Desired impression and impressions to avoid.
- Current website URL.
- Current screenshots of Landing, Chat, Dashboard.
- Existing onboarding report and progress report examples.
- Chloe's Life Compass OS diagram.
- Jungah's bead compass / factor document.
- 5 good visual references.
- 3 bad visual references with reasons.

### Helpful next
- Preferred color references.
- Font references.
- Mobile app references from Mobbin.
- Web/product references from WWIT or similar galleries.
- Existing logo or symbol drafts.
- Example copy lines the team likes.
- Example copy lines the team dislikes.
- Any constraints for demo deadline or production implementation.

## 10. Reference Evaluation Template

For each design reference, capture:

```text
Reference name:
URL or screenshot:
What we like:
What we should avoid:
Relevant screen:
Relevant component:
Reason it fits My Life Compass:
```

## 11. Open Product Questions

These should be decided before final design lock:

- Is the primary user "career transition", "solo business / founder", or broader "life direction"?
- Should the product feel more like a coach, a journal, a dashboard, or a compass?
- What exactly are the top-level compass factors?
- Is "market signal" the right language, or should it be "opportunity signal" / "outside signal" / "market fit signal"?
- Should Roadmap be visible now as a disabled future tab or hidden until ready?
- Should Chat be the center tab in the main navigation?
- How much of the report should feel analytical versus narrative?

## 12. Recommended First Design Sprint

### Sprint goal
Create a coherent My Life Compass visual direction without changing core product structure.

### Scope
- Rename product-facing references to My Life Compass where safe.
- Define visual style for Landing, Chat, Dashboard, and Roadmap placeholder.
- Redesign navigation around Chat / Dashboard / Roadmap.
- Define compass visualization style.
- Define card styles for actions, records, recommendations, and reports.
- Replace internal terminology with user-facing language.

### Out of scope for first design sprint
- New data model.
- Chat history search.
- Full Roadmap implementation.
- Second report generation.
- Multi-device sync.
- Complex recommendation engine changes.

## 13. Initial Design Brief Summary

My Life Compass should feel like a clear, warm, professional daily companion for people who are trying to decide what to do next. The product should not look like a mystical compass, a generic HR SaaS dashboard, or a technical AI engine. Its main loop is conversation, current-state reflection, and visible progress over time. The design should make Chat feel central, Dashboard feel useful, and Roadmap feel like accumulated clarity.

