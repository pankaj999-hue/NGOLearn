import { describe, expect, it } from "vitest";
import { LESSONS_BY_COURSE } from "@shared/catalog";
import { QUIZZES_BY_LESSON, getLessonQuiz } from "@shared/quizzes";

describe("lesson quizzes", () => {
  const lessons = Object.entries(LESSONS_BY_COURSE).flatMap(([courseId, items]) =>
    items.map((lesson) => ({ courseId, lessonId: lesson.id }))
  );

  it("has exactly three questions for every lesson", () => {
    expect(lessons).toHaveLength(18);
    for (const { courseId, lessonId } of lessons) {
      expect(getLessonQuiz(courseId, lessonId), `${courseId}:${lessonId}`).toHaveLength(3);
    }
  });

  it("only contains quizzes for real lessons", () => {
    const lessonKeys = new Set(lessons.map(({ courseId, lessonId }) => `${courseId}:${lessonId}`));
    expect(Object.keys(QUIZZES_BY_LESSON).sort()).toEqual([...lessonKeys].sort());
  });

  it("has valid questions, options and answers", () => {
    for (const [key, questions] of Object.entries(QUIZZES_BY_LESSON)) {
      for (const question of questions) {
        expect(question.question.trim(), key).not.toBe("");
        expect(question.options.length, question.id).toBeGreaterThanOrEqual(2);
        expect(question.answer, question.id).toBeGreaterThanOrEqual(0);
        expect(question.answer, question.id).toBeLessThan(question.options.length);
        expect(question.explanation.trim(), question.id).not.toBe("");
      }
    }
  });

  it("uses unique question ids", () => {
    const ids = Object.values(QUIZZES_BY_LESSON).flat().map((question) => question.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
