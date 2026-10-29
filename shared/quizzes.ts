export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

export const QUIZZES_BY_LESSON: Record<string, QuizQuestion[]> = {
  "basic-computer:welcome": [
    { id: "welcome-1", question: "What is the main goal of this course?", options: ["To build confidence with everyday technology", "To become a professional programmer in one day", "To memorize every keyboard shortcut"], answer: 0, explanation: "Small, practical steps build lasting confidence." },
    { id: "welcome-2", question: "What is the best first step when learning something new?", options: ["Try one small thing", "Wait until you know everything", "Skip the practice"], answer: 0, explanation: "Trying one small thing is how learning starts." },
    { id: "welcome-3", question: "What does a digital skill help you do?", options: ["Use technology to complete a real task", "Avoid using computers", "Only play games"], answer: 0, explanation: "Digital skills help with real tasks like writing, learning and building." },
  ],
  "basic-computer:computer": [
    { id: "computer-1", question: "Which part is often called the brain of the computer?", options: ["CPU", "Monitor", "Mouse"], answer: 0, explanation: "The CPU processes the instructions a computer runs." },
    { id: "computer-2", question: "Which of these is an input device?", options: ["Keyboard", "Speaker", "Printer"], answer: 0, explanation: "A keyboard sends information into the computer." },
    { id: "computer-3", question: "What does memory (RAM) do?", options: ["Holds information while you work", "Stores files permanently", "Connects to Wi-Fi"], answer: 0, explanation: "RAM holds information temporarily while programs are running." },
  ],
  "basic-computer:hardware": [
    { id: "hardware-1", question: "Which one is hardware?", options: ["Monitor", "Web browser", "Photo app"], answer: 0, explanation: "A monitor is a physical part you can touch." },
    { id: "hardware-2", question: "Which one is software?", options: ["Web browser", "Keyboard", "USB cable"], answer: 0, explanation: "A browser is a program, so it is software." },
    { id: "hardware-3", question: "What does software do?", options: ["Tells hardware what to do", "Provides electricity", "Replaces the screen"], answer: 0, explanation: "Software gives the hardware instructions." },
  ],
  "basic-computer:files": [
    { id: "files-1", question: "What is a file?", options: ["A saved unit of information", "A physical folder", "A type of monitor"], answer: 0, explanation: "A file stores information such as text, images or data." },
    { id: "files-2", question: "What is a folder used for?", options: ["Organizing files", "Deleting the internet", "Charging a laptop"], answer: 0, explanation: "Folders keep related files together." },
    { id: "files-3", question: "Which filename is easiest to understand later?", options: ["community-budget-2026.xlsx", "file1.xlsx", "aaa.xlsx"], answer: 0, explanation: "A descriptive name makes a file easy to find." },
  ],
  "basic-computer:internet": [
    { id: "internet-1", question: "What does a web browser do?", options: ["Requests and displays web pages", "Stores all websites on your device", "Creates Wi-Fi signals"], answer: 0, explanation: "A browser asks for a page and shows it to you." },
    { id: "internet-2", question: "What is Wi-Fi?", options: ["A wireless connection to a network", "A type of file", "A web page"], answer: 0, explanation: "Wi-Fi connects devices to a network without a cable." },
    { id: "internet-3", question: "What is a server?", options: ["A computer that provides content or services", "A small keyboard", "A saved folder"], answer: 0, explanation: "Servers send websites and other services to your device." },
  ],
  "basic-computer:website": [
    { id: "website-1", question: "What is a website?", options: ["A collection of related web pages", "A single image file", "A type of mouse"], answer: 0, explanation: "A website groups related pages under one address." },
    { id: "website-2", question: "What does HTML mainly provide?", options: ["Structure and meaning", "Electricity", "Internet access"], answer: 0, explanation: "HTML describes the structure and meaning of content." },
    { id: "website-3", question: "What is a URL?", options: ["The address of a web page", "A programming language", "A folder on a desktop"], answer: 0, explanation: "A URL tells the browser where to find a page." },
  ],

  "html:structure": [
    { id: "structure-1", question: "Which element contains the visible content of a page?", options: ["<body>", "<head>", "<title>"], answer: 0, explanation: "The body holds the content people see." },
    { id: "structure-2", question: "What normally comes first in an HTML document?", options: ["<!doctype html>", "<footer>", "<h1>"], answer: 0, explanation: "The doctype tells the browser this is an HTML document." },
    { id: "structure-3", question: "Which example is correctly nested?", options: ["<main><h1>Title</h1></main>", "<main><h1>Title</main></h1>", "<h1><main>Title</h1></main>"], answer: 0, explanation: "Elements should close in the reverse order they opened." },
  ],
  "html:headings": [
    { id: "headings-1", question: "Which heading is usually the main page title?", options: ["<h1>", "<h6>", "<p>"], answer: 0, explanation: "The h1 is normally the most important heading on a page." },
    { id: "headings-2", question: "Why are headings useful?", options: ["They organize content and help people scan", "They make text invisible", "They connect to Wi-Fi"], answer: 0, explanation: "Headings create a clear structure for readers and screen readers." },
    { id: "headings-3", question: "Should you normally skip from <h1> straight to <h4>?", options: ["No, keep a logical heading order", "Yes, skipping saves time", "Only on mobile"], answer: 0, explanation: "A logical order keeps the page outline understandable." },
  ],
  "html:links": [
    { id: "links-1", question: "Which tag creates a link?", options: ["<a>", "<link>", "<href>"], answer: 0, explanation: "The anchor tag creates a clickable link." },
    { id: "links-2", question: "Which attribute stores a link destination?", options: ["href", "src", "alt"], answer: 0, explanation: "The href attribute holds the link target." },
    { id: "links-3", question: "What makes an image more accessible?", options: ["Useful alt text", "A larger file size", "A random filename"], answer: 0, explanation: "Alt text describes an image for people who cannot see it." },
  ],
  "html:forms": [
    { id: "forms-1", question: "Which element labels a form input?", options: ["<label>", "<legend>", "<button>"], answer: 0, explanation: "A label names an input and connects to it." },
    { id: "forms-2", question: "Which input type hides typed characters?", options: ["password", "text", "email"], answer: 0, explanation: "The password input type hides what the person types." },
    { id: "forms-3", question: "Why connect a label to its input?", options: ["It helps screen readers and enlarges the click target", "It changes the page color", "It saves the form automatically"], answer: 0, explanation: "Connecting a label makes the form easier to use." },
  ],

  "css:selectors": [
    { id: "selectors-1", question: "Which selector targets a class named card?", options: [".card", "#card", "card"], answer: 0, explanation: "A dot selects a class." },
    { id: "selectors-2", question: "Which selector targets an id named header?", options: ["#header", ".header", "header"], answer: 0, explanation: "A hash selects an id." },
    { id: "selectors-3", question: "Which usually has higher specificity?", options: ["An id selector", "A class selector", "An element selector"], answer: 0, explanation: "An id is more specific than a class or element." },
  ],
  "css:box-model": [
    { id: "box-model-1", question: "What is padding?", options: ["Space inside the border around the content", "Space outside the border", "The border color"], answer: 0, explanation: "Padding creates space inside an element." },
    { id: "box-model-2", question: "What is margin?", options: ["Space outside the border", "Space inside the content", "The text size"], answer: 0, explanation: "Margin creates space around an element." },
    { id: "box-model-3", question: "With box-sizing: border-box, the width includes...", options: ["Content, padding and border", "Only the content", "Only the margin"], answer: 0, explanation: "Border-box keeps the total width predictable." },
  ],
  "css:flexbox": [
    { id: "flexbox-1", question: "Which property turns an element into a flex container?", options: ["display: flex", "position: flex", "flex: on"], answer: 0, explanation: "display: flex enables flexbox layout." },
    { id: "flexbox-2", question: "Which property aligns items along the main axis?", options: ["justify-content", "align-items", "text-align"], answer: 0, explanation: "justify-content works along the main axis." },
    { id: "flexbox-3", question: "Which property adds space between flex items?", options: ["gap", "border", "margin-left only"], answer: 0, explanation: "gap adds consistent space between items." },
  ],
  "css:responsive": [
    { id: "responsive-1", question: "What does mobile-first mean?", options: ["Design for small screens first, then enhance", "Design only for phones", "Hide content on phones"], answer: 0, explanation: "Mobile-first starts with the smallest layout." },
    { id: "responsive-2", question: "Which CSS feature applies styles at certain screen widths?", options: ["Media queries", "Keyframes", "Variables"], answer: 0, explanation: "Media queries adapt styles to different screen sizes." },
    { id: "responsive-3", question: "Which meta tag helps control mobile scaling?", options: ['<meta name="viewport" content="width=device-width, initial-scale=1">', '<meta name="screen" content="mobile">', '<meta name="width" content="100%">'], answer: 0, explanation: "The viewport meta tag tells mobile browsers how to scale the page." },
  ],

  "javascript:variables": [
    { id: "variables-1", question: "Which keyword declares a value that cannot be reassigned?", options: ["const", "let", "var"], answer: 0, explanation: "A const binding cannot be reassigned." },
    { id: "variables-2", question: "Which data type stores text?", options: ["String", "Number", "Boolean"], answer: 0, explanation: "Strings hold text values." },
    { id: "variables-3", question: "What does let allow that const does not?", options: ["Reassigning the variable", "Creating a function", "Starting a server"], answer: 0, explanation: "A let variable can be reassigned later." },
  ],
  "javascript:functions": [
    { id: "functions-1", question: "What is a function?", options: ["A reusable block of code", "A type of file", "A CSS selector"], answer: 0, explanation: "Functions package code so it can be reused." },
    { id: "functions-2", question: "What sends data into a function?", options: ["Arguments or parameters", "Returns", "Comments"], answer: 0, explanation: "Arguments provide values to a function." },
    { id: "functions-3", question: "Which keyword sends a value back from a function?", options: ["return", "send", "output"], answer: 0, explanation: "The return keyword gives a value back to the caller." },
  ],
  "javascript:dom": [
    { id: "dom-1", question: "What does DOM stand for?", options: ["Document Object Model", "Digital Order Map", "Data Output Method"], answer: 0, explanation: "The DOM is the browser's object model for the page." },
    { id: "dom-2", question: "Which method selects the first matching element?", options: ["document.querySelector", "document.createElement", "document.write"], answer: 0, explanation: "querySelector finds the first element that matches a selector." },
    { id: "dom-3", question: "Which property safely changes an element's text?", options: ["textContent", "innerHTML only", "src"], answer: 0, explanation: "textContent updates text without treating it as HTML." },
  ],
  "javascript:events": [
    { id: "events-1", question: "Which method listens for a click?", options: ['element.addEventListener("click", handler)', 'element.onClick = "click"', "element.listen(click)"], answer: 0, explanation: "addEventListener registers an event handler." },
    { id: "events-2", question: "What does preventDefault() do during a form submit?", options: ["Stops the browser's default behavior", "Deletes the form", "Reloads the page twice"], answer: 0, explanation: "It prevents the browser's normal submit action." },
    { id: "events-3", question: "Which event fires when a form is submitted?", options: ["submit", "clicked", "formdone"], answer: 0, explanation: "The submit event fires when a form is submitted." },
  ],
};

export function getLessonQuiz(courseId: string, lessonId: string): QuizQuestion[] {
  return QUIZZES_BY_LESSON[`${courseId}:${lessonId}`] ?? [];
}
