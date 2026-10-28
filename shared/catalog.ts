export type LessonType = "text" | "code" | "quiz" | "exercise" | "project";

export type Lesson = {
  id: string;
  title: string;
  type: LessonType;
  duration: string;
  description: string;
};

export type Course = {
  id: string;
  module: string;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  soft: string;
  level: string;
  lessons: number;
  duration: string;
  progress: number;
  iconKey: "laptop" | "code" | "sparkles" | "rocket";
  topics: string[];
};

export const COURSES: Course[] = [
  { id: "basic-computer", module: "01", title: "Computer confidence", subtitle: "Basic Computer & Website Knowledge", description: "Start from zero and make technology feel less mysterious.", color: "orange", soft: "peach", level: "Beginner", lessons: 12, duration: "2h 40m", progress: 66, iconKey: "laptop", topics: ["What is a computer?", "Files and folders", "Keyboard & mouse skills", "Internet basics", "How websites work", "Basic internet safety"] },
  { id: "html", module: "02", title: "Build the structure", subtitle: "HTML", description: "Turn ideas into meaningful, accessible web pages.", color: "yellow", soft: "butter", level: "Beginner", lessons: 11, duration: "3h 10m", progress: 38, iconKey: "code", topics: ["Document structure", "Headings & paragraphs", "Links & images", "Lists & tables", "Forms", "Semantic HTML"] },
  { id: "css", module: "03", title: "Make it feel alive", subtitle: "CSS", description: "Learn the visual language of the web: color, space and movement.", color: "teal", soft: "mint", level: "Beginner → Intermediate", lessons: 11, duration: "3h 35m", progress: 12, iconKey: "sparkles", topics: ["Selectors", "Color & typography", "Box model", "Flexbox", "CSS Grid", "Responsive design"] },
  { id: "javascript", module: "04", title: "Add the magic", subtitle: "JavaScript", description: "Make your websites respond, calculate and connect with people.", color: "ink", soft: "lilac", level: "Intermediate", lessons: 13, duration: "4h 05m", progress: 0, iconKey: "rocket", topics: ["Variables", "Functions", "Arrays & objects", "Conditions & loops", "DOM manipulation", "Events & forms"] },
];

export const LESSONS_BY_COURSE: Record<string, Lesson[]> = {
  "basic-computer": [
    { id: "welcome", title: "Welcome to your digital journey", type: "text", duration: "8 min", description: "A gentle start: what you can make with a computer and what to expect from this course." },
    { id: "computer", title: "What is a computer?", type: "text", duration: "12 min", description: "Meet the parts that help a computer receive, think, remember and share." },
    { id: "hardware", title: "Hardware & software", type: "quiz", duration: "10 min", description: "Sort the physical parts from the instructions that make them useful." },
    { id: "files", title: "Files, folders & finding your work", type: "exercise", duration: "15 min", description: "Practice naming, saving and organizing work so you can always find it again." },
    { id: "internet", title: "Internet basics", type: "text", duration: "14 min", description: "How browsers, websites, Wi-Fi and servers work together." },
    { id: "website", title: "What is a website?", type: "code", duration: "18 min", description: "Open the terminal and make your first tiny web page." },
  ],
  html: [
    { id: "structure", title: "Your first HTML document", type: "code", duration: "18 min", description: "Give your page a solid, readable structure." },
    { id: "headings", title: "Headings & paragraphs", type: "text", duration: "12 min", description: "Help your reader scan and understand your message." },
    { id: "links", title: "Links & images", type: "code", duration: "16 min", description: "Connect pages and add images with meaningful alternative text." },
    { id: "forms", title: "Forms that welcome everyone", type: "exercise", duration: "20 min", description: "Collect information with labels, focus states and clear actions." },
  ],
  css: [
    { id: "selectors", title: "Selecting the right elements", type: "text", duration: "14 min", description: "Use selectors to target exactly what you want to style." },
    { id: "box-model", title: "The box model", type: "code", duration: "20 min", description: "Understand padding, borders, margins and the space between things." },
    { id: "flexbox", title: "Flexible layouts with Flexbox", type: "code", duration: "22 min", description: "Arrange content in rows and columns without fighting the browser." },
    { id: "responsive", title: "Design for every screen", type: "project", duration: "26 min", description: "Make a friendly mobile-first card for a community program." },
  ],
  javascript: [
    { id: "variables", title: "Data that changes", type: "text", duration: "16 min", description: "Use variables and data types to describe the world around your project." },
    { id: "functions", title: "Functions: reusable ideas", type: "code", duration: "24 min", description: "Wrap a useful action once, then use it wherever you need it." },
    { id: "dom", title: "Talk to the page", type: "code", duration: "28 min", description: "Use the DOM to change content in response to a student action." },
    { id: "events", title: "Events & forms", type: "exercise", duration: "25 min", description: "Make buttons, inputs and forms respond in a helpful way." },
  ],
};

export const CAPSTONE_ITEMS = [
  "Responsive homepage",
  "About, mission & vision",
  "Programs & impact stats",
  "Volunteer & donation info",
  "Accessible navigation",
  "JavaScript interactions",
] as const;

export type CapstoneItem = (typeof CAPSTONE_ITEMS)[number];

export const LESSON_PROGRESS_KEY = (courseId: string, lessonId: string) => `${courseId}:${lessonId}`;

export function getCourse(courseId: string): Course | undefined {
  return COURSES.find((course) => course.id === courseId);
}

export function getLessons(courseId: string): Lesson[] {
  return LESSONS_BY_COURSE[courseId] ?? [];
}

export function isKnownLesson(courseId: string, lessonId: string): boolean {
  return getLessons(courseId).some((lesson) => lesson.id === lessonId);
}

export function isKnownCourse(courseId: string): boolean {
  return Boolean(getCourse(courseId));
}

export function isKnownCapstoneItem(item: string): boolean {
  return (CAPSTONE_ITEMS as readonly string[]).includes(item);
}

export function isCourseComplete(progress: Record<string, boolean>, courseId: string): boolean {
  const lessons = getLessons(courseId);
  return lessons.length > 0 && lessons.every((lesson) => progress[LESSON_PROGRESS_KEY(courseId, lesson.id)]);
}
