# Gamification verification

The dashboard now shows a level card with XP progress, the learner's current level name, a daily mission worth 25 XP, and an achievement shelf with earned and locked badges. The lesson completion action is connected to local progress persistence and awards XP only on first completion, while updating the learner streak. The XP, badge, streak, and level helper behavior is covered by Vitest. Desktop screenshots confirmed the gamification panel integrates cleanly above active courses; mobile CSS stacks the level, mission, and badge sections for touch-friendly use.
