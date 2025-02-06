const mongoose = require('mongoose');
const Course = require('../models/Course');

const MONGO_URI = 'mongodb+srv://bakhytzhan:1234@cluster0.wii3v.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const courses = [
    {
        title: "JavaScript Fundamentals",
        description: "Learn the basics of JavaScript programming language",
        instructor: "John Smith",
        price: 49.99,
        duration: "4 weeks",
        level: "Beginner",
        image: "/api/placeholder/400/300",
        lessons: [
            {
                title: "Introduction to JavaScript",
                description: "Basic concepts and setup",
                // Используем embed ссылку с YouTube
                videoUrl: "https://www.youtube.com/embed/W6NZfCO5SIk",
                content: "Introduction to JavaScript programming language...",
                order: 1,
                quiz: {
                    title: "JavaScript Basics Quiz",
                    questions: [{
                        questionId: 1,
                        question: "What is JavaScript?",
                        options: ["Programming language", "Database", "Operating System", "Web Browser"],
                        correctAnswer: 0
                    }]
                }
            },
            {
                title: "Variables and Data Types",
                description: "Understanding variables and basic data types",
                videoUrl: "https://www.youtube.com/embed/edlFjlzxkSI",
                content: "Learn about variables in JavaScript...",
                order: 2,
                quiz: {
                    title: "Variables Quiz",
                    questions: [{
                        questionId: 1,
                        question: "Which keyword is used to declare variables?",
                        options: ["var", "let", "const", "All of the above"],
                        correctAnswer: 3
                    }]
                }
            },
            {
                title: "Functions in JavaScript",
                description: "Working with functions",
                videoUrl: "https://www.youtube.com/embed/xUI5Tsl2JpY",
                content: "Understanding functions in JavaScript...",
                order: 3,
                quiz: {
                    title: "Functions Quiz",
                    questions: [{
                        questionId: 1,
                        question: "What is a function?",
                        options: ["A block of code", "A variable", "A data type", "None of the above"],
                        correctAnswer: 0
                    }]
                }
            }
        ]
    },
    {
        title: "React Basics",
        description: "Introduction to React.js framework",
        instructor: "Sarah Johnson",
        price: 59.99,
        duration: "4 weeks",
        level: "Intermediate",
        image: "/api/placeholder/400/300",
        lessons: [
            {
                title: "Introduction to React",
                description: "Understanding React basics",
                videoUrl: "https://www.youtube.com/embed/Ke90Tje7VS0",
                content: "Learn the basics of React...",
                order: 1,
                quiz: {
                    title: "React Basics Quiz",
                    questions: [{
                        questionId: 1,
                        question: "What is React?",
                        options: ["Framework", "Library", "Language", "Database"],
                        correctAnswer: 1
                    }]
                }
            },
            {
                title: "Components",
                description: "Working with React components",
                videoUrl: "https://www.youtube.com/embed/Rh3tobg7hEo",
                content: "Understanding React components...",
                order: 2,
                quiz: {
                    title: "Components Quiz",
                    questions: [{
                        questionId: 1,
                        question: "What is a component?",
                        options: ["Function", "Class", "Both A and B", "None"],
                        correctAnswer: 2
                    }]
                }
            },
            {
                title: "State and Props",
                description: "Managing state and props in React",
                videoUrl: "https://www.youtube.com/embed/4ORZ1GmjaMc",
                content: "Learn about state and props...",
                order: 3,
                quiz: {
                    title: "State & Props Quiz",
                    questions: [{
                        questionId: 1,
                        question: "What is state in React?",
                        options: ["Data storage", "Function", "Component", "Element"],
                        correctAnswer: 0
                    }]
                }
            }
        ]
    },
    {
        title: "Node.js Essentials",
        description: "Backend development with Node.js",
        instructor: "Mike Wilson",
        price: 69.99,
        duration: "6 weeks",
        level: "Intermediate",
        image: "/api/placeholder/400/300",
        lessons: [
            {
                title: "Introduction to Node.js",
                description: "Getting started with Node.js",
                videoUrl: "https://www.youtube.com/embed/TlB_eWDSMt4",
                content: "Learn the basics of Node.js...",
                order: 1,
                quiz: {
                    title: "Node.js Basics Quiz",
                    questions: [{
                        questionId: 1,
                        question: "What is Node.js?",
                        options: ["Runtime environment", "Framework", "Library", "Language"],
                        correctAnswer: 0
                    }]
                }
            },
            {
                title: "Express.js Basics",
                description: "Building web applications with Express",
                videoUrl: "https://www.youtube.com/embed/L72fhGm1tfE",
                content: "Introduction to Express.js framework...",
                order: 2,
                quiz: {
                    title: "Express Quiz",
                    questions: [{
                        questionId: 1,
                        question: "What is Express.js?",
                        options: ["Web framework", "Database", "Programming language", "Operating system"],
                        correctAnswer: 0
                    }]
                }
            },
            {
                title: "MongoDB with Node.js",
                description: "Working with MongoDB database",
                videoUrl: "https://www.youtube.com/embed/pWbMrx5rVBE",
                content: "Learn to work with MongoDB...",
                order: 3,
                quiz: {
                    title: "MongoDB Quiz",
                    questions: [{
                        questionId: 1,
                        question: "What type of database is MongoDB?",
                        options: ["NoSQL", "SQL", "Graph", "None of above"],
                        correctAnswer: 0
                    }]
                }
            }
        ]
    },
    {
        title: "Web Design Fundamentals",
        description: "Learn HTML, CSS, and design principles",
        instructor: "Emma Davis",
        price: 39.99,
        duration: "4 weeks",
        level: "Beginner",
        image: "/api/placeholder/400/300",
        lessons: [
            {
                title: "HTML Basics",
                description: "Introduction to HTML",
                videoUrl: "https://www.youtube.com/embed/UB1O30fR-EE",
                content: "Learn the fundamentals of HTML...",
                order: 1,
                quiz: {
                    title: "HTML Quiz",
                    questions: [{
                        questionId: 1,
                        question: "What does HTML stand for?",
                        options: [
                            "Hyper Text Markup Language",
                            "High Text Making Language",
                            "Hyper Text Making Language",
                            "None of above"
                        ],
                        correctAnswer: 0
                    }]
                }
            },
            {
                title: "CSS Fundamentals",
                description: "Styling web pages with CSS",
                videoUrl: "https://www.youtube.com/embed/yfoY53QXEnI",
                content: "Learn CSS styling...",
                order: 2,
                quiz: {
                    title: "CSS Quiz",
                    questions: [{
                        questionId: 1,
                        question: "What is CSS used for?",
                        options: ["Styling", "Programming", "Database", "Server"],
                        correctAnswer: 0
                    }]
                }
            },
            {
                title: "Responsive Design",
                description: "Making websites responsive",
                videoUrl: "https://www.youtube.com/embed/srvUrASNj0s",
                content: "Learn about responsive web design...",
                order: 3,
                quiz: {
                    title: "Responsive Design Quiz",
                    questions: [{
                        questionId: 1,
                        question: "What is responsive design?",
                        options: [
                            "Design that works on all devices",
                            "Mobile only design",
                            "Desktop only design",
                            "None of above"
                        ],
                        correctAnswer: 0
                    }]
                }
            }
        ]
    }
];

const addCourses = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');
        
        const insertedCourses = await Course.insertMany(courses);
        console.log(`Successfully added ${insertedCourses.length} courses`);
        
    } catch (error) {
        console.error('Error adding courses:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

addCourses();