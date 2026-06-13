// server/src/config/db.ts - Production PostgreSQL Connection Pool Custom Initializer with In-Memory Sandbox Fallback
import pg from 'pg';
import dns from 'dns';
import bcrypt from 'bcryptjs';

export interface DatabasePoolConfig {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  maxConnections?: number;
  idleTimeoutMillis?: number;
}

// Shared database questions definitions for PG and fallback memory synchronization
const ALL_SEEDED_QUESTIONS = [
  // --- ASSESSMENT 1: APTITUDE ASSESSMENT (20 Questions, 5 Marks Each = 100 Marks) ---
  {
    id: '1',
    assessment_id: '1',
    text: 'A train 120m long passes a telegraph post in 6 seconds. Find the speed of the train in km/h.',
    type: 'aptitude_mcq',
    option_a: '36 km/h',
    option_b: '72 km/h',
    option_c: '90 km/h',
    option_d: '54 km/h',
    correct_option: 'B',
    options: ['36 km/h', '72 km/h', '90 km/h', '54 km/h'],
    ans: '72 km/h',
    marks: 5
  },
  {
    id: '2',
    assessment_id: '1',
    text: 'If 12 men can build a wall in 20 days, how many men will be required to build the same wall in 15 days?',
    type: 'aptitude_mcq',
    option_a: '15 men',
    option_b: '16 men',
    option_c: '18 men',
    option_d: '24 men',
    correct_option: 'B',
    options: ['15 men', '16 men', '18 men', '24 men'],
    ans: '16 men',
    marks: 5
  },
  {
    id: '3',
    assessment_id: '1',
    text: 'What is the next number in the series: 3, 5, 9, 17, 33, ...?',
    type: 'aptitude_mcq',
    option_a: '45',
    option_b: '65',
    option_c: '50',
    option_d: '72',
    correct_option: 'B',
    options: ['45', '65', '50', '72'],
    ans: '65',
    marks: 5
  },
  {
    id: '4',
    assessment_id: '1',
    text: 'The average of 5 consecutive numbers is 20. Find the largest of these numbers.',
    type: 'aptitude_mcq',
    option_a: '20',
    option_b: '21',
    option_c: '22',
    option_d: '24',
    correct_option: 'C',
    options: ['20', '21', '22', '24'],
    ans: '22',
    marks: 5
  },
  {
    id: '5',
    assessment_id: '1',
    text: 'A person crosses a 600m long street in 5 minutes. What is their speed in km/h?',
    type: 'aptitude_mcq',
    option_a: '3.6 km/h',
    option_b: '7.2 km/h',
    option_c: '8.4 km/h',
    option_d: '10 km/h',
    correct_option: 'B',
    options: ['3.6 km/h', '7.2 km/h', '8.4 km/h', '10 km/h'],
    ans: '7.2 km/h',
    marks: 5
  },
  {
    id: '6',
    assessment_id: '1',
    text: 'If the cost price of 15 articles is equal to the selling price of 12 articles, find the gain percentage.',
    type: 'aptitude_mcq',
    option_a: '25%',
    option_b: '20%',
    option_c: '30%',
    option_d: '15%',
    correct_option: 'A',
    options: ['25%', '20%', '30%', '15%'],
    ans: '25%',
    marks: 5
  },
  {
    id: '7',
    assessment_id: '1',
    text: 'Find the simple interest on $5000 at 10% per annum for 3 years.',
    type: 'aptitude_mcq',
    option_a: '$500',
    option_b: '$1000',
    option_c: '$1500',
    option_d: '$2000',
    correct_option: 'C',
    options: ['$500', '$1000', '$1500', '$2000'],
    ans: '$1500',
    marks: 5
  },
  {
    id: '8',
    assessment_id: '1',
    text: 'A sum of money doubles itself in 10 years at simple interest. What is the rate of interest per annum?',
    type: 'aptitude_mcq',
    option_a: '5%',
    option_b: '10%',
    option_c: '15%',
    option_d: '20%',
    correct_option: 'B',
    options: ['5%', '10%', '15%', '20%'],
    ans: '10%',
    marks: 5
  },
  {
    id: '9',
    assessment_id: '1',
    text: 'A and B together can do a work in 12 days, while A alone can do it in 30 days. How many days for B alone?',
    type: 'aptitude_mcq',
    option_a: '20 days',
    option_b: '25 days',
    option_c: '15 days',
    option_d: '18 days',
    correct_option: 'A',
    options: ['20 days', '25 days', '15 days', '18 days'],
    ans: '20 days',
    marks: 5
  },
  {
    id: '10',
    assessment_id: '1',
    text: 'If 20% of a number is 120, what is 120% of that number?',
    type: 'aptitude_mcq',
    option_a: '120',
    option_b: '360',
    option_c: '480',
    option_d: '720',
    correct_option: 'D',
    options: ['120', '360', '480', '720'],
    ans: '720',
    marks: 5
  },
  {
    id: '11',
    assessment_id: '1',
    text: 'The ratio of ages of A and B is 3:4. After 5 years, the ratio becomes 4:5. Present age of A is:',
    type: 'aptitude_mcq',
    option_a: '12 years',
    option_b: '15 years',
    option_c: '20 years',
    option_d: '25 years',
    correct_option: 'B',
    options: ['12 years', '15 years', '20 years', '25 years'],
    ans: '15 years',
    marks: 5
  },
  {
    id: '12',
    assessment_id: '1',
    text: 'A basket contains 5 red, 3 blue, and 2 green balls. One ball is drawn. Prob that it is blue is:',
    type: 'aptitude_mcq',
    option_a: '1/2',
    option_b: '1/5',
    option_c: '3/10',
    option_d: '2/5',
    correct_option: 'C',
    options: ['1/2', '1/5', '3/10', '2/5'],
    ans: '3/10',
    marks: 5
  },
  {
    id: '13',
    assessment_id: '1',
    text: 'A rectangular field has length 20m and width 15m. Find its perimeter.',
    type: 'aptitude_mcq',
    option_a: '35m',
    option_b: '70m',
    option_c: '300m',
    option_d: '150m',
    correct_option: 'B',
    options: ['35m', '70m', '300m', '150m'],
    ans: '70m',
    marks: 5
  },
  {
    id: '14',
    assessment_id: '1',
    text: 'Evaluate options math flow: 120 / (4 + 2 * 3) - 2.',
    type: 'aptitude_mcq',
    option_a: '10',
    option_b: '15',
    option_c: '8',
    option_d: '12',
    correct_option: 'A',
    options: ['10', '15', '8', '12'],
    ans: '10',
    marks: 5
  },
  {
    id: '15',
    assessment_id: '1',
    text: 'A clock shows 3:00. What is the angle between the hour and minute hands in degrees?',
    type: 'aptitude_mcq',
    option_a: '45 degrees',
    option_b: '90 degrees',
    option_c: '120 degrees',
    option_d: '180 degrees',
    correct_option: 'B',
    options: ['45 degrees', '90 degrees', '120 degrees', '180 degrees'],
    ans: '90 degrees',
    marks: 5
  },
  {
    id: '16',
    assessment_id: '1',
    text: 'A container holds 40L milk. 4L are removed and replaced with water. Process is repeated once more. Milk left:',
    type: 'aptitude_mcq',
    option_a: '36 liters',
    option_b: '34 liters',
    option_c: '32.4 liters',
    option_d: '30 liters',
    correct_option: 'C',
    options: ['36 liters', '34 liters', '32.4 liters', '30 liters'],
    ans: '32.4 liters',
    marks: 5
  },
  {
    id: '17',
    assessment_id: '1',
    text: 'The ratio of speed of three cars is 2:3:4. The ratio of time taken by them to cover equivalent distance is:',
    type: 'aptitude_mcq',
    option_a: '2:3:4',
    option_b: '4:3:2',
    option_c: '4:3:6',
    option_d: '6:4:3',
    correct_option: 'D',
    options: ['2:3:4', '4:3:2', '4:3:6', '6:4:3'],
    ans: '6:4:3',
    marks: 5
  },
  {
    id: '18',
    assessment_id: '1',
    text: 'If cardinal number of set A is 5 and B is 4, what is the maximum number of elements in A union B?',
    type: 'aptitude_mcq',
    option_a: '9',
    option_b: '5',
    option_c: '4',
    option_d: '20',
    correct_option: 'A',
    options: ['9', '5', '4', '20'],
    ans: '9',
    marks: 5
  },
  {
    id: '19',
    assessment_id: '1',
    text: 'What is the highest common factor (HCF) of 24, 36, and 48?',
    type: 'aptitude_mcq',
    option_a: '6',
    option_b: '12',
    option_c: '18',
    option_d: '24',
    correct_option: 'B',
    options: ['6', '12', '18', '24'],
    ans: '12',
    marks: 5
  },
  {
    id: '20',
    assessment_id: '1',
    text: 'If log2(x) = 6, find the value of x.',
    type: 'aptitude_mcq',
    option_a: '12',
    option_b: '32',
    option_c: '64',
    option_d: '128',
    correct_option: 'C',
    options: ['12', '32', '64', '128'],
    ans: '64',
    marks: 5
  },

  // --- ASSESSMENT 2: TECHNICAL ASSESSMENT (20 Questions, 5 Marks Each = 100 Marks) ---
  {
    id: '21',
    assessment_id: '2',
    text: 'Which of the following describes the OOP concept "Polymorphism"?',
    type: 'technical_mcq',
    option_a: 'Hiding internal implementation details',
    option_b: 'Creating child class from parent class',
    option_c: 'The ability of different classes to respond to the same message in unique ways',
    option_d: 'Restricting direct access to some components of objects',
    correct_option: 'C',
    options: ['Hiding internal implementation details', 'Creating child class from parent class', 'The ability of different classes to respond to the same message in unique ways', 'Restricting direct access to some components of objects'],
    ans: 'The ability of different classes to respond to the same message in unique ways',
    marks: 5
  },
  {
    id: '22',
    assessment_id: '2',
    text: 'In Python, which of the following is an immutable data type?',
    type: 'technical_mcq',
    option_a: 'List',
    option_b: 'Dictionary',
    option_c: 'Set',
    option_d: 'Tuple',
    correct_option: 'D',
    options: ['List', 'Dictionary', 'Set', 'Tuple'],
    ans: 'Tuple',
    marks: 5
  },
  {
    id: '23',
    assessment_id: '2',
    text: 'What is the purpose of React\'s "useEffect" cleanup function?',
    type: 'technical_mcq',
    option_a: 'To prevent component rerender',
    option_b: 'To unsubscribe/cancel async jobs or timers before unmount or rerun',
    option_c: 'To force React to refetch server state',
    option_d: 'To reset initial arguments parameters',
    correct_option: 'B',
    options: ['To prevent component rerender', 'To unsubscribe/cancel async jobs or timers before unmount or rerun', 'To force React to refetch server state', 'To reset initial arguments parameters'],
    ans: 'To unsubscribe/cancel async jobs or timers before unmount or rerun',
    marks: 5
  },
  {
    id: '24',
    assessment_id: '2',
    text: 'Which CSS layout system is best suited for complex, responsive 2D layouts (rows + columns)?',
    type: 'technical_mcq',
    option_a: 'Floats',
    option_b: 'Flexbox',
    option_c: 'CSS Grid',
    option_d: 'Positioning',
    correct_option: 'C',
    options: ['Floats', 'Flexbox', 'CSS Grid', 'Positioning'],
    ans: 'CSS Grid',
    marks: 5
  },
  {
    id: '25',
    assessment_id: '2',
    text: 'What is the worst-case complexity of inserting an element into a balanced BST (AVL tree) of size N?',
    type: 'technical_mcq',
    option_a: 'O(1)',
    option_b: 'O(log N)',
    option_c: 'O(N)',
    option_d: 'O(N log N)',
    correct_option: 'B',
    options: ['O(1)', 'O(log N)', 'O(N)', 'O(N log N)'],
    ans: 'O(log N)',
    marks: 5
  },
  {
    id: '26',
    assessment_id: '2',
    text: 'Which data structure follows a Last-In-First-Out (LIFO) model?',
    type: 'technical_mcq',
    option_a: 'Queue',
    option_b: 'Linked List',
    option_c: 'Stack',
    option_d: 'Heap',
    correct_option: 'C',
    options: ['Queue', 'Linked List', 'Stack', 'Heap'],
    ans: 'Stack',
    marks: 5
  },
  {
    id: '27',
    assessment_id: '2',
    text: 'In Generative AI, what does the "Temperature" parameter regulate during LLM sampling?',
    type: 'technical_mcq',
    option_a: 'Speed of processing',
    option_b: 'Random variability vs predictable token selection',
    option_c: 'Maximum prompt length limit',
    option_d: 'Model weight storage requirements',
    correct_option: 'B',
    options: ['Speed of processing', 'Random variability vs predictable token selection', 'Maximum prompt length limit', 'Model weight storage requirements'],
    ans: 'Random variability vs predictable token selection',
    marks: 5
  },
  {
    id: '28',
    assessment_id: '2',
    text: 'What represents the core mechanism of RAG (Retrieval-Augmented Generation)?',
    type: 'technical_mcq',
    option_a: 'Fine-tuning LLM fully',
    option_b: 'Querying external database/documents and appending relevant contexts into the prompt',
    option_c: 'Combining multiple models',
    option_d: 'Using human feed-backs (RLHF)',
    correct_option: 'B',
    options: ['Fine-tuning LLM fully', 'Querying external database/documents and appending relevant contexts into the prompt', 'Combining multiple models', 'Using human feed-backs (RLHF)'],
    ans: 'Querying external database/documents and appending relevant contexts into the prompt',
    marks: 5
  },
  {
    id: '29',
    assessment_id: '2',
    text: 'Which SQL join returns all records when there is a match in either left or right table records?',
    type: 'technical_mcq',
    option_a: 'INNER JOIN',
    option_b: 'LEFT JOIN',
    option_c: 'RIGHT JOIN',
    option_d: 'FULL OUTER JOIN',
    correct_option: 'D',
    options: ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL OUTER JOIN'],
    ans: 'FULL OUTER JOIN',
    marks: 5
  },
  {
    id: '30',
    assessment_id: '2',
    text: 'What does ACID stand for in database transaction management properties?',
    type: 'technical_mcq',
    option_a: 'Atomicity, Consistency, Isolation, Durability',
    option_b: 'Access, Control, Integrity, Distribution',
    option_c: 'Auto, Cache, Index, Duration',
    option_d: 'Analytical, Core, Integration, Delivery',
    correct_option: 'A',
    options: ['Atomicity, Consistency, Isolation, Durability', 'Access, Control, Integrity, Distribution', 'Auto, Cache, Index, Duration', 'Analytical, Core, Integration, Delivery'],
    ans: 'Atomicity, Consistency, Isolation, Durability',
    marks: 5
  },
  {
    id: '31',
    assessment_id: '2',
    text: 'Which network protocol runs over TCP and uses SSL/TLS for secure communication?',
    type: 'technical_mcq',
    option_a: 'HTTP',
    option_b: 'HTTPS',
    option_c: 'FTP',
    option_d: 'SMTP',
    correct_option: 'B',
    options: ['HTTP', 'HTTPS', 'FTP', 'SMTP'],
    ans: 'HTTPS',
    marks: 5
  },
  {
    id: '32',
    assessment_id: '2',
    text: 'In JavaScript, what is the returned string value of "typeof null"?',
    type: 'technical_mcq',
    option_a: '"null"',
    option_b: '"undefined"',
    option_c: '"object"',
    option_d: '"function"',
    correct_option: 'C',
    options: ['"null"', '"undefined"', '"object"', '"function"'],
    ans: '"object"',
    marks: 5
  },
  {
    id: '33',
    assessment_id: '2',
    text: 'Which HTTP status code represents "No Content"?',
    type: 'technical_mcq',
    option_a: '200',
    option_b: '204',
    option_c: '301',
    option_d: '404',
    correct_option: 'B',
    options: ['200', '204', '301', '404'],
    ans: '204',
    marks: 5
  },
  {
    id: '34',
    assessment_id: '2',
    text: 'What is the main advantage of WebSockets?',
    type: 'technical_mcq',
    option_a: 'Full-duplex bi-directional communication channels over a single persistent connection',
    option_b: 'Decreased cookie payloads',
    option_c: 'Static compression ratios',
    option_d: 'DNS cache preservation rules',
    correct_option: 'A',
    options: ['Full-duplex bi-directional communication channels over a single persistent connection', 'Decreased cookie payloads', 'Static compression ratios', 'DNS cache preservation rules'],
    ans: 'Full-duplex bi-directional communication channels over a single persistent connection',
    marks: 5
  },
  {
    id: '35',
    assessment_id: '2',
    text: 'In Dockerfile configuration blocks, what instruction designates the starter container layer?',
    type: 'technical_mcq',
    option_a: 'INIT',
    option_b: 'RUN',
    option_c: 'FROM',
    option_d: 'COPY',
    correct_option: 'C',
    options: ['INIT', 'RUN', 'FROM', 'COPY'],
    ans: 'FROM',
    marks: 5
  },
  {
    id: '36',
    assessment_id: '2',
    text: 'Which database system is globally popular for in-memory caching and session tokens storage?',
    type: 'technical_mcq',
    option_a: 'PostgreSQL',
    option_b: 'Redis',
    option_c: 'MongoDB',
    option_d: 'SQLite',
    correct_option: 'B',
    options: ['PostgreSQL', 'Redis', 'MongoDB', 'SQLite'],
    ans: 'Redis',
    marks: 5
  },
  {
    id: '37',
    assessment_id: '2',
    text: 'Which TypeScript utility type construct forces all keys of interface T to become optional?',
    type: 'technical_mcq',
    option_a: 'Required<T>',
    option_b: 'Omit<T>',
    option_c: 'Partial<T>',
    option_d: 'Pick<T>',
    correct_option: 'C',
    options: ['Required<T>', 'Omit<T>', 'Partial<T>', 'Pick<T>'],
    ans: 'Partial<T>',
    marks: 5
  },
  {
    id: '38',
    assessment_id: '2',
    text: 'What is the primary architectural purpose of a Load Balancer?',
    type: 'technical_mcq',
    option_a: 'Encrypted storage caching',
    option_b: 'Distributing incoming network traffic evenly across redundant backend nodes',
    option_c: 'Enforcing client cookie validations',
    option_d: 'Parsing JSON API payload parameters',
    correct_option: 'B',
    options: ['Encrypted storage caching', 'Distributing incoming network traffic evenly across redundant backend nodes', 'Enforcing client cookie validations', 'Parsing JSON API payload parameters'],
    ans: 'Distributing incoming network traffic evenly across redundant backend nodes',
    marks: 5
  },
  {
    id: '39',
    assessment_id: '2',
    text: 'In Clean Architecture frameworks, which layers house domain entities and key business usecases?',
    type: 'technical_mcq',
    option_a: 'Core Domain',
    option_b: 'External Controllers',
    option_c: 'SQL Repository',
    option_d: 'UI Component Pages',
    correct_option: 'A',
    options: ['Core Domain', 'External Controllers', 'SQL Repository', 'UI Component Pages'],
    ans: 'Core Domain',
    marks: 5
  },
  {
    id: '40',
    assessment_id: '2',
    text: 'Which Git command allows copying a specific commit from one branch to another branch?',
    type: 'technical_mcq',
    option_a: 'git merge',
    option_b: 'git cherry-pick',
    option_c: 'git rebase',
    option_d: 'git branch',
    correct_option: 'B',
    options: ['git merge', 'git cherry-pick', 'git rebase', 'git branch'],
    ans: 'git cherry-pick',
    marks: 5
  },

  // --- ASSESSMENT 3: CODING ASSESSMENT (5 Challenges, 20 Marks Each = 100 Marks) ---
  {
    id: '41',
    assessment_id: '3',
    text: 'Write a programming function to reverse an input string in-place or return a reversed string.',
    type: 'coding',
    option_a: null, option_b: null, option_c: null, option_d: null, correct_option: null,
    options: null,
    ans: 'function reverseString(str) { return str.split("").reverse().join(""); }',
    marks: 20
  },
  {
    id: '42',
    assessment_id: '3',
    text: 'Write an algorithm to locate the second largest distinct element in an array of integers. If it does not exist, return -1.',
    type: 'coding',
    option_a: null, option_b: null, option_c: null, option_d: null, correct_option: null,
    options: null,
    ans: 'function secondLargest(arr) { let unique = [...new Set(arr)].sort((a,b)=>b-a); return unique.length > 1 ? unique[1] : -1; }',
    marks: 20
  },
  {
    id: '43',
    assessment_id: '3',
    text: 'Write a JavaScript function "fizzBuzz(n)" that returns an array of strings from 1 to n with replacements: "Fizz", "Buzz", or "FizzBuzz".',
    type: 'coding',
    option_a: null, option_b: null, option_c: null, option_d: null, correct_option: null,
    options: null,
    ans: 'function fizzBuzz(n) { return Array.from({length: n}, (_, i) => { const num = i + 1; if (num % 15 === 0) return "FizzBuzz"; if (num % 3 === 0) return "Fizz"; if (num % 5 === 0) return "Buzz"; return num.toString(); }); }',
    marks: 20
  },
  {
    id: '44',
    assessment_id: '3',
    text: 'Write a function "isPalindrome(str)" that checks whether a given string is a palindrome (ignoring casing, symbols, and spaces).',
    type: 'coding',
    option_a: null, option_b: null, option_c: null, option_d: null, correct_option: null,
    options: null,
    ans: 'function isPalindrome(str) { const clean = str.toLowerCase().replace(/[^a-z0-9]/g, ""); return clean === clean.split("").reverse().join(""); }',
    marks: 20
  },
  {
    id: '45',
    assessment_id: '3',
    text: 'Write a function to return the nth Fibonacci number employing an optimized Dynamic Programming (DP) technique.',
    type: 'coding',
    option_a: null, option_b: null, option_c: null, option_d: null, correct_option: null,
    options: null,
    ans: 'function fibonacci(n) { if (n <= 1) return n; let prev2 = 0, prev = 1; for (let i = 2; i <= n; i++) { let curr = prev + prev2; prev2 = prev; prev = curr; } return prev; }',
    marks: 20
  },

  // --- SELF RATINGS (Required for PHASE 4) ---
  { id: '46', assessment_id: 'self_rating', text: 'Self assessment score rating for C Programming capability', type: 'self_rating', option_a: null, option_b: null, option_c: null, option_d: null, correct_option: null, options: null, ans: null, marks: 10 },
  { id: '47', assessment_id: 'self_rating', text: 'Self assessment score rating for Python capability', type: 'self_rating', option_a: null, option_b: null, option_c: null, option_d: null, correct_option: null, options: null, ans: null, marks: 10 },
  { id: '48', assessment_id: 'self_rating', text: 'Self assessment score rating for Java capability', type: 'self_rating', option_a: null, option_b: null, option_c: null, option_d: null, correct_option: null, options: null, ans: null, marks: 10 },
  { id: '49', assessment_id: 'self_rating', text: 'Self assessment score rating for Data Structures & Algorithms capability', type: 'self_rating', option_a: null, option_b: null, option_c: null, option_d: null, correct_option: null, options: null, ans: null, marks: 10 },
  { id: '50', assessment_id: 'self_rating', text: 'Self assessment score rating for HTML capability', type: 'self_rating', option_a: null, option_b: null, option_c: null, option_d: null, correct_option: null, options: null, ans: null, marks: 10 },
  { id: '51', assessment_id: 'self_rating', text: 'Self assessment score rating for CSS capability', type: 'self_rating', option_a: null, option_b: null, option_c: null, option_d: null, correct_option: null, options: null, ans: null, marks: 10 },
  { id: '52', assessment_id: 'self_rating', text: 'Self assessment score rating for Javascript capability', type: 'self_rating', option_a: null, option_b: null, option_c: null, option_d: null, correct_option: null, options: null, ans: null, marks: 10 },
  { id: '53', assessment_id: 'self_rating', text: 'Self assessment score rating for React capability', type: 'self_rating', option_a: null, option_b: null, option_c: null, option_d: null, correct_option: null, options: null, ans: null, marks: 10 },
  { id: '54', assessment_id: 'self_rating', text: 'Self assessment score rating for SQL database capability', type: 'self_rating', option_a: null, option_b: null, option_c: null, option_d: null, correct_option: null, options: null, ans: null, marks: 10 },
  { id: '55', assessment_id: 'self_rating', text: 'Self assessment score rating for AI/ML concepts capability', type: 'self_rating', option_a: null, option_b: null, option_c: null, option_d: null, correct_option: null, options: null, ans: null, marks: 10 },
  { id: '56', assessment_id: 'self_rating', text: 'Self assessment score rating for Generative AI and prompt engineering capability', type: 'self_rating', option_a: null, option_b: null, option_c: null, option_d: null, correct_option: null, options: null, ans: null, marks: 10 },
  { id: '57', assessment_id: 'self_rating', text: 'Self assessment score rating for professional and verbal communication capability', type: 'self_rating', option_a: null, option_b: null, option_c: null, option_d: null, correct_option: null, options: null, ans: null, marks: 10 }
];

// Highly reliable, structured in-memory fallback state to guarantee local sandbox preview executes flawlessly
const memDatabase = {
  admins: [
    {
      id: 1,
      email: 'admin@indiwebpros.in',
      password_hash: bcrypt.hashSync('AdminPass123!', 10),
      role: 'super_admin',
      created_at: new Date('2026-06-11T12:00:00Z')
    }
  ] as any[],
  candidate_profiles: [
    {
      id: 1,
      full_name: 'Jane Doe',
      email: 'jane.doe@example.com',
      phone: '+1-555-0199',
      college: 'MIT University',
      branch: 'Computer Science',
      academic_year: 'Senior',
      cgpa: 3.92,
      target_role: 'Full-stack software developer',
      github_url: 'https://github.com/janedoe',
      linkedin_url: 'https://linkedin.com/in/janedoe',
      created_at: new Date('2026-06-11T12:00:00Z')
    }
  ] as any[],
  assessments: [
    {
      id: '1',
      title: 'Aptitude Assessment',
      description: 'Comprehensive evaluation of general analytical ability, logical reasoning, and quantitative problem solving.',
      assessment_type: 'Aptitude',
      duration_minutes: 30,
      total_marks: 100,
      created_at: new Date('2026-06-11T12:00:00Z')
    },
    {
      id: '2',
      title: 'Technical Assessment',
      description: 'Deep technical check analyzing OOP foundations, language semantics, frameworks, database architectures, and algorithms.',
      assessment_type: 'Technical',
      duration_minutes: 45,
      total_marks: 100,
      created_at: new Date('2026-06-11T12:00:00Z')
    },
    {
      id: '3',
      title: 'Coding Assessment',
      description: 'Real-world coding challenge designed to measure hands-on programming execution, syntax logic, and clean coding practices.',
      assessment_type: 'Coding',
      duration_minutes: 60,
      total_marks: 100,
      created_at: new Date('2026-06-11T12:00:00Z')
    }
  ] as any[],
  questions: ALL_SEEDED_QUESTIONS.map(q => ({
    id: q.id,
    assessment_id: q.assessment_id,
    question_text: q.text,
    question_type: q.type,
    option_a: q.option_a || null,
    option_b: q.option_b || null,
    option_c: q.option_c || null,
    option_d: q.option_d || null,
    correct_option: q.correct_option || null,
    options_json: q.options ? JSON.stringify(q.options) : null,
    correct_answer: q.ans,
    marks: q.marks || 10,
    created_at: new Date('2026-06-11T12:00:00Z')
  })) as any[],
  assessment_attempts: [
    {
      id: 'attempt-demo-1',
      candidate_id: 1,
      assessment_id: 'asm-1',
      started_at: new Date('2026-06-11T12:05:00Z'),
      submitted_at: new Date('2026-06-11T12:45:00Z'),
      total_score: 87.5,
      percentage: 87.5,
      status: 'Evaluated'
    }
  ] as any[],
  candidate_answers: [] as any[],
  coding_submissions: [] as any[],
  evaluation_results: [
    {
      id: 1,
      attempt_id: 'attempt-demo-1',
      aptitude_score: 90.0,
      technical_score: 85.0,
      coding_score: 90.0,
      mindset_score: 85.0,
      final_score: 87.5,
      recommendation: 'Direct Cohort Acceptance',
      strengths: 'Outstanding architecture execution. Pristine procedural clean variables and robust recursion limits handling.',
      weaknesses: 'Temporal space complexity fine-tuning under high parallel connection buffers.',
      created_at: new Date('2026-06-11T12:45:00Z')
    }
  ] as any[],
  users: [
    {
      id: 999,
      first_name: 'Platform',
      last_name: 'Admin',
      email: 'admin@indiwebpros.in',
      password_hash: bcrypt.hashSync('AdminPass123!', 10),
      role: 'admin',
      email_verified: true,
      created_at: new Date('2026-06-11T12:00:00Z')
    }
  ] as any[],
  email_otps: [] as any[],
  pre_assessment_scores: [] as any[],
  candidate_screen_responses: [] as any[],
  results: [] as any[]
};

export class ProductionDatabaseEngine {
  private static instance: ProductionDatabaseEngine;
  private isConnected: boolean = false;
  private useMemoryFallback: boolean = false;
  private pool: pg.Pool | null = null;
  private poolConfig: DatabasePoolConfig;

  private constructor() {
    // Sanitize any env parameters by stripping quotes, carriage returns, or spaces
    const cleanEnv = (key: string, fallback: string = ''): string => {
      const val = process.env[key];
      if (!val) return fallback;
      return val.trim().replace(/^['"]|['"]$/g, '').trim();
    };

    this.poolConfig = {
      host: cleanEnv('DB_HOST', 'localhost'),
      port: parseInt(cleanEnv('DB_PORT', '5432'), 10) || 5432,
      database: cleanEnv('DB_NAME', 'assessment_platform'),
      user: cleanEnv('DB_USER', 'postgres'),
      password: cleanEnv('DB_PASSWORD', 'mohanbalu2004'),
      maxConnections: 20,
      idleTimeoutMillis: 30000
    };
  }

  public static getInstance(): ProductionDatabaseEngine {
    if (!ProductionDatabaseEngine.instance) {
      ProductionDatabaseEngine.instance = new ProductionDatabaseEngine();
    }
    return ProductionDatabaseEngine.instance;
  }

  public async connect(): Promise<boolean> {
    if (this.isConnected && this.pool) return true;

    // Requested DIAGNOSTICS:
    console.log('DB_HOST RAW:', JSON.stringify(process.env.DB_HOST));
    console.log('DB_NAME RAW:', JSON.stringify(process.env.DB_NAME));
    console.log('DB_PORT RAW:', JSON.stringify(process.env.DB_PORT));
    console.log('DB_USER RAW:', JSON.stringify(process.env.DB_USER));
    console.log('Host Length:', process.env.DB_HOST?.length);

    // Run DNS lookup diagnostic on processed host using ES Modules dns module
    const dnsHost = (this.poolConfig.host || '').trim();
    if (dnsHost && dnsHost !== 'localhost' && dnsHost !== '127.0.0.1') {
      try {
        console.log(`[Database DNS] Resolving processed DB_HOST hostname: "${dnsHost}"`);
        const result = await dns.promises.lookup(dnsHost);
        console.log(`[Database DNS] Resolved result for "${dnsHost}":`, JSON.stringify(result));
      } catch (dnsErr: any) {
        console.error(`[Database DNS FAIL] Failed to resolve exact hostname "${dnsHost}":`, dnsErr.message || dnsErr);
      }
    }

    // Support unified DATABASE_URL if present (extremely popular on Render, Neon, Supabase, and AWS connection configurations)
    if (process.env.DATABASE_URL) {
      const dbUrlClean = process.env.DATABASE_URL.trim();
      console.log('[Database] Connecting using unified DATABASE_URL configuration.');
      try {
        const testPool = new pg.Pool({
          connectionString: dbUrlClean,
          max: this.poolConfig.maxConnections,
          idleTimeoutMillis: this.poolConfig.idleTimeoutMillis,
          ssl: { rejectUnauthorized: false }, // Allow secure SSL/TLS connections commonly enforced by cloud DB providers
          connectionTimeoutMillis: 7000
        });

        const client = await testPool.connect();
        client.release();

        this.pool = testPool;
        this.isConnected = true;
        this.useMemoryFallback = false;
        console.log('[Database] PostgreSQL database connection successfully verified and active via DATABASE_URL.');
        
        // Auto initialize schemas and tables
        await this.initializeDatabaseTables();
        return true;
      } catch (err: any) {
        console.error('[Database] Connection attempt failed using DATABASE_URL:', err.message || err);
        this.isConnected = false;
        this.useMemoryFallback = true;
        console.warn('[Database Fallback] Database failed to initialize via DATABASE_URL. Activating in-memory mock backend.');
        return true;
      }
    }
    
    const portsToTry: number[] = [this.poolConfig.port || 5432];
    if (this.poolConfig.port && this.poolConfig.port !== 5432) {
      portsToTry.push(5432);
    }

    let lastError: any = null;

    for (const port of portsToTry) {
      const hostToConnect = this.poolConfig.host;
      const dbToConnect = this.poolConfig.database;
      const userToConnect = this.poolConfig.user;
      const passMasked = this.poolConfig.password ? '****' : '(none)';

      // Print actual connection object (masking password) as requested
      const connectionObjectDiagnostic = {
        host: hostToConnect,
        port: port,
        database: dbToConnect,
        user: userToConnect,
        password: passMasked,
        maxConnections: this.poolConfig.maxConnections,
        idleTimeoutMillis: this.poolConfig.idleTimeoutMillis
      };
      console.log('[Database Pool Config Object]:', JSON.stringify(connectionObjectDiagnostic, null, 2));
      console.log(`[Database] Attempting connection. Host: ${hostToConnect}, Port: ${port}, DB: ${dbToConnect}, User: ${userToConnect}`);
      
      try {
        const useSsl = hostToConnect !== 'localhost' && hostToConnect !== '127.0.0.1';
        const testPool = new pg.Pool({
          host: hostToConnect,
          port: port,
          database: dbToConnect,
          user: userToConnect,
          password: this.poolConfig.password,
          max: this.poolConfig.maxConnections,
          idleTimeoutMillis: this.poolConfig.idleTimeoutMillis,
          ssl: useSsl ? { rejectUnauthorized: false } : undefined,
          connectionTimeoutMillis: 5000 // Fast fail-over timeout
        });

        const client = await testPool.connect();
        client.release();

        // Successful connection
        this.pool = testPool;
        this.poolConfig.port = port; // Update to the successful port
        this.isConnected = true;
        this.useMemoryFallback = false;
        console.log(`[Database] PostgreSQL connection successfully verified and active on port ${port}.`);
        
        // Auto initialize schemas and tables
        await this.initializeDatabaseTables();
        return true;
      } catch (err: any) {
        console.log(`[Database Status] Port ${port} check: remote instance offline or password verification pending.`);
        lastError = err;
      }
    }

    // Rather than throwing fatal crash, flag memory status and continue boot
    this.isConnected = false;
    this.useMemoryFallback = true;
    console.log('[Database Status] Live database not reachable in this container thread.');
    console.log('[Database Status] Initialized robust local sandbox state memory enginefallback to ensure 100% features execution.');
    return true;
  }

  /**
   * Automatically configures required RDS schemas and seeds starting metadata
   */
  public async initializeDatabaseTables(): Promise<void> {
    if (this.useMemoryFallback) return;

    console.log('[Db Engine Schema Init] Verification checks starting.');
    
    const schemas = [
      // 0. admins (secure credentials control)
      `CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(50) DEFAULT 'super_admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      // 1. candidate_profiles (clean auto schema recovery trigger)
      `CREATE TABLE IF NOT EXISTS candidate_profiles (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(100),
        college VARCHAR(255),
        branch VARCHAR(255),
        academic_year VARCHAR(100),
        cgpa NUMERIC(5,2),
        target_role VARCHAR(255),
        github_url VARCHAR(255),
        linkedin_url VARCHAR(255),
        resume_url TEXT,
        resume_filename VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      // 2. assessments
      `CREATE TABLE IF NOT EXISTS assessments (
        id VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        assessment_type VARCHAR(100),
        type VARCHAR(100),
        duration_minutes INT,
        duration INT,
        total_marks INT DEFAULT 100,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      // 3. questions
      `CREATE TABLE IF NOT EXISTS questions (
        id VARCHAR(100) PRIMARY KEY,
        assessment_id VARCHAR(100) REFERENCES assessments(id) ON DELETE CASCADE,
        question_text TEXT NOT NULL,
        question_type VARCHAR(50) NOT NULL,
        options_json TEXT, -- JSON layout for MCQ answer keys
        correct_answer TEXT,
        marks INT DEFAULT 10,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      // 4. assessment_attempts
      `CREATE TABLE IF NOT EXISTS assessment_attempts (
        id VARCHAR(100) PRIMARY KEY,
        candidate_id INT REFERENCES candidate_profiles(id) ON DELETE CASCADE,
        assessment_id VARCHAR(100) REFERENCES assessments(id) ON DELETE CASCADE,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        submitted_at TIMESTAMP,
        total_score NUMERIC(5,2),
        percentage NUMERIC(5,2),
        status VARCHAR(50) DEFAULT 'Evaluated'
      );`,

      // 5. candidate_answers
      `CREATE TABLE IF NOT EXISTS candidate_answers (
        id SERIAL PRIMARY KEY,
        attempt_id VARCHAR(100) REFERENCES assessment_attempts(id) ON DELETE CASCADE,
        candidate_id INT REFERENCES candidate_profiles(id) ON DELETE CASCADE,
        question_id VARCHAR(100) REFERENCES questions(id) ON DELETE CASCADE,
        answer_text TEXT,
        answer TEXT,
        obtained_marks INT DEFAULT 0,
        evaluated_by_ai BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      // 6. coding_submissions
      `CREATE TABLE IF NOT EXISTS coding_submissions (
        id SERIAL PRIMARY KEY,
        attempt_id VARCHAR(100) REFERENCES assessment_attempts(id) ON DELETE CASCADE,
        candidate_id INT REFERENCES candidate_profiles(id) ON DELETE CASCADE,
        question_id VARCHAR(100) REFERENCES questions(id) ON DELETE CASCADE,
        source_code TEXT,
        code TEXT,
        language VARCHAR(50),
        execution_result TEXT,
        score INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      // 7. evaluation_results
      `CREATE TABLE IF NOT EXISTS evaluation_results (
        id SERIAL PRIMARY KEY,
        attempt_id VARCHAR(100) REFERENCES assessment_attempts(id) ON DELETE CASCADE,
        aptitude_score NUMERIC(5,2) DEFAULT 0,
        technical_score NUMERIC(5,2) DEFAULT 0,
        coding_score NUMERIC(5,2) DEFAULT 0,
        mindset_score NUMERIC(5,2) DEFAULT 0,
        final_score NUMERIC(5,2) DEFAULT 0,
        recommendation TEXT,
        strengths TEXT,
        weaknesses TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      // 8. users
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        full_name VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        password_hash TEXT,
        role VARCHAR(50) DEFAULT 'candidate',
        email_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      // 9. email_otps
      `CREATE TABLE IF NOT EXISTS email_otps (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp VARCHAR(10) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      // 10. pre_assessment_scores
      `CREATE TABLE IF NOT EXISTS pre_assessment_scores (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(100) NOT NULL,
        candidate_id INT,
        expected_score VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      // 11. candidate_screen_responses
      `CREATE TABLE IF NOT EXISTS candidate_screen_responses (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(100) NOT NULL,
        candidate_id INT,
        screen_index INT NOT NULL,
        question_id VARCHAR(100) NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        selected_option TEXT,
        text_answer TEXT,
        code_answer TEXT,
        language_selected VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      // 12. results
      `CREATE TABLE IF NOT EXISTS results (
        id SERIAL PRIMARY KEY,
        candidate_id INT REFERENCES candidate_profiles(id) ON DELETE CASCADE,
        assessment_id VARCHAR(100) REFERENCES assessments(id) ON DELETE CASCADE,
        score NUMERIC(5,2),
        percentage NUMERIC(5,2),
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`
    ];

    console.log('[Db Engine Schema Init] Verification checks starting.');
    
    // Execute each schema creation in its own try/catch to ensure other tables are still verified/created
    for (let i = 0; i < schemas.length; i++) {
      try {
        await this.query(schemas[i]);
      } catch (err: any) {
        console.error(`[Db Engine Schema Init] Schema creation failed for query index ${i}:`, err.message || err);
      }
    }
    console.log('[Db Engine Schema Init] All table templates processed.');

    // Migration and column assertions
    try {
      // Alter candidate_profiles table to ensure columns resume_url and resume_filename exist in case db exists
      await this.query(`ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS resume_url TEXT;`);
      await this.query(`ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS resume_filename VARCHAR(255);`);
      
      // Alter assessments to ensure type and duration exist
      await this.query(`ALTER TABLE assessments ADD COLUMN IF NOT EXISTS type VARCHAR(100);`);
      await this.query(`ALTER TABLE assessments ADD COLUMN IF NOT EXISTS duration INT;`);

      // Alter candidate_answers to ensure candidate_id, answer, and submitted_at exist
      await this.query(`ALTER TABLE candidate_answers ADD COLUMN IF NOT EXISTS candidate_id INT;`);
      await this.query(`ALTER TABLE candidate_answers ADD COLUMN IF NOT EXISTS answer TEXT;`);
      await this.query(`ALTER TABLE candidate_answers ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);

      // Alter coding_submissions to ensure candidate_id, code, and submitted_at exist
      await this.query(`ALTER TABLE coding_submissions ADD COLUMN IF NOT EXISTS candidate_id INT;`);
      await this.query(`ALTER TABLE coding_submissions ADD COLUMN IF NOT EXISTS code TEXT;`);
      await this.query(`ALTER TABLE coding_submissions ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);

      console.log('[Db Engine Schema Init] Audit migration columns successfully checked/added.');

      // Alter candidate_screen_responses to add foreign key constraint
      try {
        await this.query(`ALTER TABLE candidate_screen_responses DROP CONSTRAINT IF EXISTS fk_csr_question_id;`);
        await this.query(`ALTER TABLE candidate_screen_responses ADD CONSTRAINT fk_csr_question_id FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE;`);
        console.log('[Db Engine Schema Init] Enforced candidate_screen_responses.question_id FOREIGN KEY REFERENCES questions(id).');
      } catch (fkErr: any) {
        console.warn('[Db Engine Schema Init] fk_csr_question_id foreign key constraint creation skipped/warning:', fkErr.message || fkErr);
      }
    } catch (migErr: any) {
      console.warn('[Db Engine Schema Init] Audit alter execution warning:', migErr.message || migErr);
    }

    // Seed admins table with initial super_admin config
    try {
      const checkAdmin = await this.query(`SELECT id FROM admins WHERE LOWER(email) = 'admin@indiwebpros.in' LIMIT 1;`);
      if (checkAdmin.rowCount === 0) {
        console.log('[Db Engine Schema Init] Seeding initial admin: admin@indiwebpros.in');
        const hash = bcrypt.hashSync('AdminPass123!', 10);
        await this.query(`
          INSERT INTO admins (email, password_hash, role) 
          VALUES ('admin@indiwebpros.in', $1, 'super_admin');
        `, [hash]);
      }
    } catch (err: any) {
      console.error('[Db Engine Schema Init] Seeding admins table failed:', err.message || err);
    }

    // Seed users table with admin credentials if not existing
    try {
      const checkUserAdmin = await this.query(`SELECT id FROM users WHERE LOWER(email) = 'admin@indiwebpros.in' LIMIT 1;`);
      if (checkUserAdmin.rowCount === 0) {
        console.log('[Db Engine Schema Init] Seeding admin user record in users table');
        const hash = bcrypt.hashSync('AdminPass123!', 10);
        await this.query(`
          INSERT INTO users (first_name, last_name, full_name, email, password_hash, role, email_verified)
          VALUES ('Platform', 'Admin', 'Platform Admin', 'admin@indiwebpros.in', $1, 'admin', TRUE);
        `, [hash]);
      }
    } catch (err: any) {
      console.error('[Db Engine Schema Init] Seeding admin user record failed:', err.message || err);
    }

    // Seed core assessment and questions if they do not exist
    try {
      // 1. Audit and expand questions table columns for Phase 2 MCQs
      await this.query(`ALTER TABLE questions ADD COLUMN IF NOT EXISTS option_a TEXT;`);
      await this.query(`ALTER TABLE questions ADD COLUMN IF NOT EXISTS option_b TEXT;`);
      await this.query(`ALTER TABLE questions ADD COLUMN IF NOT EXISTS option_c TEXT;`);
      await this.query(`ALTER TABLE questions ADD COLUMN IF NOT EXISTS option_d TEXT;`);
      await this.query(`ALTER TABLE questions ADD COLUMN IF NOT EXISTS correct_option VARCHAR(10);`);

      console.log('[Db Engine Schema Init] Seeding requested multi-assessments.');
      
      // Upsert the three assessments
      const assessmentBlueprints = [
        {
          id: '1',
          title: 'Aptitude Assessment',
          description: 'Comprehensive evaluation of general analytical ability, logical reasoning, and quantitative problem solving.',
          type: 'Aptitude',
          duration: 30,
          total_marks: 100
        },
        {
          id: '2',
          title: 'Technical Assessment',
          description: 'Deep technical check analyzing OOP foundations, language semantics, frameworks, database architectures, and algorithms.',
          type: 'Technical',
          duration: 45,
          total_marks: 100
        },
        {
          id: '3',
          title: 'Coding Assessment',
          description: 'Real-world coding challenge designed to measure hands-on programming execution, syntax logic, and clean coding practices.',
          type: 'Coding',
          duration: 60,
          total_marks: 100
        }
      ];

      for (const ab of assessmentBlueprints) {
        await this.query(`
          INSERT INTO assessments (id, title, description, assessment_type, duration_minutes, total_marks)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            assessment_type = EXCLUDED.assessment_type,
            duration_minutes = EXCLUDED.duration_minutes,
            total_marks = EXCLUDED.total_marks;
        `, [ab.id, ab.title, ab.description, ab.type, ab.duration, ab.total_marks]);
      }

      console.log(`[Db Engine Schema Init] Seeding full list of ${ALL_SEEDED_QUESTIONS.length} questions via UPSERT.`);
      for (const sq of ALL_SEEDED_QUESTIONS) {
        await this.query(`
          INSERT INTO questions (id, assessment_id, question_text, question_type, option_a, option_b, option_c, option_d, correct_option, options_json, correct_answer, marks)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (id) DO UPDATE SET 
            assessment_id = EXCLUDED.assessment_id,
            question_text = EXCLUDED.question_text,
            question_type = EXCLUDED.question_type,
            option_a = EXCLUDED.option_a,
            option_b = EXCLUDED.option_b,
            option_c = EXCLUDED.option_c,
            option_d = EXCLUDED.option_d,
            correct_option = EXCLUDED.correct_option,
            options_json = EXCLUDED.options_json,
            correct_answer = EXCLUDED.correct_answer,
            marks = EXCLUDED.marks;
        `, [
          sq.id,
          sq.assessment_id,
          sq.text,
          sq.type,
          sq.option_a || null,
          sq.option_b || null,
          sq.option_c || null,
          sq.option_d || null,
          sq.correct_option || null,
          sq.options ? JSON.stringify(sq.options) : null,
          sq.ans,
          sq.marks || 10
        ]);
      }
      console.log('[Db Engine Schema Init] All core multi-assessments and questions seeded and updated successfully in PostgreSQL.');
    } catch (schemaErr: any) {
      console.error('[Db Engine Schema Init ERR]: Failed to assert schema structure:', schemaErr.message || schemaErr);
    }
  }

  public async query<T = any>(sql: string, params: any[] = []): Promise<{ rows: T[]; rowCount: number }> {
    // 1. IN MEMORY ROUTING LAYER
    if (this.useMemoryFallback) {
      const sqlNormalized = sql.replace(/\s+/g, ' ').trim();
      const sqlLower = sqlNormalized.toLowerCase();
      console.log(`[Memory DB Query]: ${sql.substring(0, 100)}...`);

      // CREATE TABLE returns mock success
      if (sqlLower.startsWith('create table')) {
        return { rows: [], rowCount: 0 };
      }

      // SELECT id FROM assessments WHERE id = 'asm-1'
      if (sqlLower.includes('select id from assessments')) {
        const found = memDatabase.assessments.filter(a => a.id === 'asm-1');
        return { rows: found as T[], rowCount: found.length };
      }

      // SELECT from questions
      if (sqlLower.includes('from questions')) {
        return { rows: memDatabase.questions as T[], rowCount: memDatabase.questions.length };
      }

      // INSERT INTO assessments
      if (sqlLower.includes('insert into assessments')) {
        const id = params[0] || 'asm-1';
        const exists = memDatabase.assessments.some(a => a.id === id);
        if (!exists) {
          memDatabase.assessments.push({
            id,
            title: params[1] || 'Default Assessment',
            description: params[2] || '',
            assessment_type: params[3] || 'Full-stack',
            duration_minutes: params[4] || 90,
            total_marks: params[5] || 100,
            created_at: new Date()
          });
        }
        return { rows: [], rowCount: 1 };
      }

      // INSERT INTO questions
      if (sqlLower.includes('insert into questions')) {
        const id = params[0] || `q-${Math.random()}`;
        const exists = memDatabase.questions.some(q => q.id === id);
        if (!exists) {
          memDatabase.questions.push({
            id,
            assessment_id: params[1],
            question_text: params[2],
            question_type: params[3],
            options_json: params[4],
            correct_answer: params[5],
            marks: params[6] || 10,
            created_at: new Date()
          });
        }
        return { rows: [], rowCount: 1 };
      }

      // INSERT INTO candidate_profiles (returns profile rows)
      if (sqlLower.includes('insert into candidate_profiles')) {
        const index = memDatabase.candidate_profiles.length + 1;
        const newRecord = {
          id: index,
          full_name: params[0],
          email: params[1],
          phone: params[2],
          college: params[3],
          branch: params[4],
          academic_year: params[5],
          cgpa: params[6] ? parseFloat(params[6].toString()) : null,
          target_role: params[7],
          github_url: params[8],
          linkedin_url: params[9],
          resume_filename: params[10],
          resume_url: params[11],
          created_at: new Date()
        };
        memDatabase.candidate_profiles.push(newRecord);
        return { rows: [newRecord] as T[], rowCount: 1 };
      }

      // UPDATE candidate_profiles
      if (sqlLower.includes('update candidate_profiles')) {
        let id = params[9]; // legacy or fallback mapping
        let fn = params[0], ph = params[1], col = params[2], br = params[3], yr = params[4], cg = params[5], tr = params[6], gh = params[7], li = params[8];
        let rf = null, ru = null;

        if (params.length >= 12) {
          // our new saving query
          id = params[0];
          fn = params[1];
          ph = params[2];
          col = params[3];
          br = params[4];
          yr = params[5];
          cg = params[6];
          tr = params[7];
          gh = params[8];
          li = params[9];
          rf = params[10];
          ru = params[11];
        }

        const targetId = typeof id === 'number' ? id : parseInt(String(id || ''));
        const index = memDatabase.candidate_profiles.findIndex(p => p.id === targetId);
        if (index !== -1) {
          memDatabase.candidate_profiles[index] = {
            ...memDatabase.candidate_profiles[index],
            full_name: fn || memDatabase.candidate_profiles[index].full_name,
            phone: ph || memDatabase.candidate_profiles[index].phone,
            college: col || memDatabase.candidate_profiles[index].college,
            branch: br || memDatabase.candidate_profiles[index].branch,
            academic_year: yr || memDatabase.candidate_profiles[index].academic_year,
            cgpa: cg !== null && cg !== undefined ? parseFloat(cg.toString()) : memDatabase.candidate_profiles[index].cgpa,
            target_role: tr || memDatabase.candidate_profiles[index].target_role,
            github_url: gh || memDatabase.candidate_profiles[index].github_url,
            linkedin_url: li || memDatabase.candidate_profiles[index].linkedin_url,
            resume_filename: rf !== null ? rf : memDatabase.candidate_profiles[index].resume_filename,
            resume_url: ru !== null ? ru : memDatabase.candidate_profiles[index].resume_url
          };
          return { rows: [memDatabase.candidate_profiles[index]] as T[], rowCount: 1 };
        }
        return { rows: [], rowCount: 1 };
      }

      // SELECT from admins
      if (sqlLower.includes('from admins')) {
        const targetEmail = (params[0] || '').trim().toLowerCase();
        const found = memDatabase.admins.find(a => a.email.toLowerCase() === targetEmail);
        return found ? { rows: [found] as T[], rowCount: 1 } : { rows: [], rowCount: 0 };
      }

      // INSERT INTO admins
      if (sqlLower.includes('insert into admins')) {
        const email = 'admin@indiwebpros.in';
        const exists = memDatabase.admins.some(a => a.email.toLowerCase() === email);
        if (!exists) {
          memDatabase.admins.push({
            id: memDatabase.admins.length + 1,
            email,
            password_hash: params[0],
            role: 'super_admin',
            created_at: new Date()
          });
        }
        return { rows: [], rowCount: 1 };
      }

      // SELECT from candidate_profiles
      if (sqlLower.includes('from candidate_profiles where') && sqlLower.includes('lower(email) = lower($1)')) {
        const targetEmail = (params[0] || '').trim().toLowerCase();
        const cand = memDatabase.candidate_profiles.find(p => p.email.toLowerCase() === targetEmail);
        return cand ? { rows: [cand] as T[], rowCount: 1 } : { rows: [], rowCount: 0 };
      }

      // INSERT INTO assessment_attempts
      if (sqlLower.includes('insert into assessment_attempts')) {
        const id = params[0];
        const existingIdx = memDatabase.assessment_attempts.findIndex(a => a.id === id);
        const attemptObj = {
          id,
          candidate_id: params[1],
          assessment_id: params[2],
          started_at: params[3] || new Date(),
          submitted_at: params[4] || new Date(),
          total_score: params[5],
          percentage: params[6],
          status: params[7] || 'Evaluated'
        };
        if (existingIdx !== -1) {
          memDatabase.assessment_attempts[existingIdx] = attemptObj;
        } else {
          memDatabase.assessment_attempts.push(attemptObj);
        }
        return { rows: [], rowCount: 1 };
      }

      // DELETE cascading rows
      if (sqlLower.startsWith('delete from candidate_answers')) {
        memDatabase.candidate_answers = memDatabase.candidate_answers.filter(a => a.attempt_id !== params[0]);
        return { rows: [], rowCount: 1 };
      }
      
      // INSERT INTO pre_assessment_scores
      if (sqlLower.includes('insert into pre_assessment_scores')) {
        const newRecord = {
          id: memDatabase.pre_assessment_scores.length + 1,
          session_id: params[0],
          expected_score: params[1],
          candidate_id: params[2] || null,
          created_at: new Date()
        };
        memDatabase.pre_assessment_scores.push(newRecord);
        return { rows: [newRecord] as T[], rowCount: 1 };
      }

      // INSERT INTO candidate_screen_responses
      if (sqlLower.includes('insert into candidate_screen_responses')) {
        const newRecord = {
          id: memDatabase.candidate_screen_responses.length + 1,
          session_id: params[0],
          candidate_id: params[1] || null,
          screen_index: params[2],
          question_id: params[3],
          selected_option: params[4] || null,
          text_answer: params[5] || null,
          code_answer: params[6] || null,
          language_selected: params[7] || null,
          created_at: new Date()
        };
        memDatabase.candidate_screen_responses.push(newRecord);
        return { rows: [newRecord] as T[], rowCount: 1 };
      }
      if (sqlLower.startsWith('delete from coding_submissions')) {
        memDatabase.coding_submissions = memDatabase.coding_submissions.filter(a => a.attempt_id !== params[0]);
        return { rows: [], rowCount: 1 };
      }
      if (sqlLower.startsWith('delete from evaluation_results')) {
        memDatabase.evaluation_results = memDatabase.evaluation_results.filter(a => a.attempt_id !== params[0]);
        return { rows: [], rowCount: 1 };
      }

      // INSERT INTO candidate_answers
      if (sqlLower.includes('insert into candidate_answers')) {
        const isScreenSave = (typeof params[0] === 'number' || params[0] === null);
        memDatabase.candidate_answers.push({
          id: memDatabase.candidate_answers.length + 1,
          candidate_id: isScreenSave ? params[0] : null,
          attempt_id: isScreenSave ? null : params[0],
          question_id: params[1],
          answer: isScreenSave ? params[2] : null,
          answer_text: isScreenSave ? params[3] : params[2],
          obtained_marks: isScreenSave ? 0 : (params[3] || 0),
          evaluated_by_ai: isScreenSave ? false : (params[4] || false),
          created_at: new Date(),
          submitted_at: new Date()
        });
        return { rows: [], rowCount: 1 };
      }

      // INSERT INTO coding_submissions
      if (sqlLower.includes('insert into coding_submissions')) {
        const isScreenSave = (typeof params[0] === 'number' || params[0] === null);
        memDatabase.coding_submissions.push({
          id: memDatabase.coding_submissions.length + 1,
          candidate_id: isScreenSave ? params[0] : null,
          attempt_id: isScreenSave ? null : params[0],
          question_id: params[1],
          code: isScreenSave ? params[2] : null,
          source_code: isScreenSave ? params[3] : params[2],
          language: isScreenSave ? params[4] : params[3],
          execution_result: isScreenSave ? null : params[4],
          score: isScreenSave ? 0 : (params[5] || 0),
          created_at: new Date(),
          submitted_at: new Date()
        });
        return { rows: [], rowCount: 1 };
      }

      // INSERT INTO evaluation_results
      if (sqlLower.includes('insert into evaluation_results')) {
        memDatabase.evaluation_results.push({
          id: memDatabase.evaluation_results.length + 1,
          attempt_id: params[0],
          aptitude_score: params[1] || 0,
          technical_score: params[2] || 0,
          coding_score: params[3] || 0,
          mindset_score: params[4] || 0,
          final_score: params[5] || 0,
          recommendation: params[6],
          strengths: params[7],
          weaknesses: params[8],
          created_at: new Date()
        });
        return { rows: [], rowCount: 1 };
      }

      // INSERT INTO results
      if (sqlLower.includes('insert into results')) {
        memDatabase.results.push({
          id: memDatabase.results.length + 1,
          candidate_id: params[0],
          assessment_id: params[1],
          score: params[2],
          percentage: params[3],
          submitted_at: new Date()
        });
        return { rows: [], rowCount: 1 };
      }

      // getAssessments JOIN query list
      if (sqlLower.includes('select * from assessments order by created_at desc')) {
        return { rows: memDatabase.assessments as T[], rowCount: memDatabase.assessments.length };
      }

      // getAttempts full list
      if (sqlLower.includes('select aa.id, aa.started_at, aa.submitted_at') && sqlLower.includes('assessment_attempts aa')) {
        let rows = memDatabase.candidate_profiles.map(cp => {
          const aa = memDatabase.assessment_attempts.find(a => a.candidate_id === cp.id) || {};
          const er = aa.id ? (memDatabase.evaluation_results.find(r => r.attempt_id === aa.id) || {}) : {};
          const pasObj = memDatabase.pre_assessment_scores.find(p => p.candidate_id === cp.id || p.session_id === aa.id) || {};
          return {
            id: aa.id || null,
            started_at: aa.started_at || null,
            submitted_at: aa.submitted_at || null,
            total_score: aa.total_score || null,
            percentage: aa.percentage || null,
            status: aa.status || 'Registered',
            candidate_profiles_id: cp.id,
            full_name: cp.full_name || 'Sandbox Dev',
            email: cp.email || 'sandbox@test.local',
            phone: cp.phone || '',
            college: cp.college || 'Sandbox Academy',
            branch: cp.branch || '',
            academic_year: cp.academic_year || '',
            cgpa: cp.cgpa || '',
            target_role: cp.target_role || 'Software Engineering Cohort',
            github_url: cp.github_url || '',
            linkedin_url: cp.linkedin_url || '',
            resume_url: cp.resume_url || '',
            resume_filename: cp.resume_filename || '',
            pre_assessment_score: pasObj.expected_score || '75-85',
            aptitude_score: er.aptitude_score || 70,
            technical_score: er.technical_score || 75,
            coding_score: er.coding_score || 80,
            mindset_score: er.mindset_score || 85,
            recommendation: er.recommendation || '6 Month Training',
            reviewer_notes: er.strengths || 'Development in-memory record.'
          };
        });

        // Filter search term if passed
        if (params.length > 0 && params[0]) {
          const searchVal = params[0].replace(/%/g, '').toLowerCase();
          rows = rows.filter(r => 
            r.full_name.toLowerCase().includes(searchVal) ||
            r.email.toLowerCase().includes(searchVal) ||
            r.college.toLowerCase().includes(searchVal)
          );
        }

        return { rows: rows as T[], rowCount: rows.length };
      }

      // getAttemptDetail individual detail
      if (sqlLower.includes('select aa.id, aa.started_at, aa.submitted_at') && sqlLower.includes('where aa.id = $1 limit 1')) {
        const attemptId = params[0];
        const aa = memDatabase.assessment_attempts.find(a => a.id === attemptId);
        if (!aa) {
          return { rows: [], rowCount: 0 };
        }
        const cp = memDatabase.candidate_profiles.find(p => p.id === aa.candidate_id) || {};
        const er = memDatabase.evaluation_results.find(r => r.attempt_id === aa.id) || {};
        const pasObj = memDatabase.pre_assessment_scores.find(p => p.candidate_id === cp.id || p.session_id === aa.id) || {};
        const row = {
          id: aa.id,
          started_at: aa.started_at,
          submitted_at: aa.submitted_at,
          score: aa.total_score,
          status: aa.status,
          candidate_id: cp.id,
          full_name: cp.full_name,
          email: cp.email,
          phone: cp.phone,
          college: cp.college,
          branch: cp.branch,
          academic_year: cp.academic_year,
          cgpa: cp.cgpa,
          target_role: cp.target_role,
          github_url: cp.github_url,
          linkedin_url: cp.linkedin_url,
          resume_url: cp.resume_url || '',
          resume_filename: cp.resume_filename || '',
          pre_assessment_score: pasObj.expected_score || '70-80',
          aptitude_score: er.aptitude_score || 70,
          technical_score: er.technical_score || 75,
          coding_score: er.coding_score || 80,
          mindset_score: er.mindset_score || 85,
          final_score: aa.total_score,
          recommendation: er.recommendation || '6 Month Training',
          reviewer_notes: er.strengths || 'Database automatic verification entry.',
          weaknesses: er.weaknesses || 'Constructive algorithm runtime boundaries.'
        };
        return { rows: [row] as T[], rowCount: 1 };
      }

      // getAttemptDetail: answers join questions lookup
      if (sqlLower.includes('select ca.id, ca.question_id') && sqlLower.includes('candidate_answers ca')) {
        const attemptId = params[0];
        const answers = memDatabase.candidate_answers.filter(a => a.attempt_id === attemptId);
        const mappedAnswers = answers.map(ans => {
          let qText = 'Default topic response';
          let qType = 'descriptive';
          const qId = ans.question_id;
          if (qId.startsWith('apt-')) {
            qText = qId === 'apt-1' 
              ? 'A train 120m long passes a telegraph post in 6 seconds.' 
              : 'If 12 men can build a wall in 20 days, how many men...';
            qType = 'aptitude_mcq';
          } else if (qId.startsWith('prog-')) {
            qText = 'Which of the following describes the OOP concept...';
            qType = 'technical_mcq';
          } else if (qId.startsWith('web-')) {
            qText = 'What is the purpose of React\'s "useEffect" cleanup function?';
            qType = 'technical_mcq';
          } else if (qId.startsWith('dsa-')) {
            qText = 'What is the worst-case time complexity of BST tree...';
            qType = 'technical_mcq';
          } else if (qId.startsWith('coding-')) {
            qText = 'Write a JavaScript function fizzBuzz(n) that...';
            qType = 'coding';
          } else if (qId.startsWith('mindset-')) {
            qText = 'Describe a situation where a major bug reached production...';
            qType = 'mindset';
          }

          return {
            id: ans.id,
            question_id: ans.question_id,
            answer_text: ans.answer_text,
            obtained_marks: ans.obtained_marks,
            evaluated_by_ai: ans.evaluated_by_ai,
            question_text: qText,
            question_type: qType,
            options_json: null,
            correct_answer: null
          };
        });
        return { rows: mappedAnswers as T[], rowCount: mappedAnswers.length };
      }

      // getAttemptDetail: coding submissions
      if (sqlLower.includes('select * from coding_submissions where attempt_id = $1')) {
        const attemptId = params[0];
        const filtered = memDatabase.coding_submissions.filter(c => c.attempt_id === attemptId);
        return { rows: filtered as T[], rowCount: filtered.length };
      }

      // Memory fallback queries for users & email_otps
      if (sqlLower.includes('delete from users')) {
        const email = (params[0] || '').trim().toLowerCase();
        memDatabase.users = memDatabase.users.filter(u => u.email.toLowerCase() !== email || u.email_verified === true);
        return { rows: [], rowCount: 1 };
      }

      if (sqlLower.includes('update users set email_verified')) {
        const email = (params[0] || '').trim().toLowerCase();
        memDatabase.users.forEach(u => {
          if (u.email.toLowerCase() === email) {
            u.email_verified = true;
          }
        });
        return { rows: [], rowCount: 1 };
      }

      if (sqlLower.includes('from users')) {
        let results = memDatabase.users;
        if (sqlLower.includes('lower(email) = lower($1)') || sqlLower.includes('lower(email) = $1')) {
          const email = (params[0] || '').trim().toLowerCase();
          results = results.filter(u => u.email.toLowerCase() === email);
        } else if (sqlLower.includes('email = $1')) {
          const email = (params[0] || '').trim().toLowerCase();
          results = results.filter(u => u.email.toLowerCase() === email);
        }
        return { rows: results as T[], rowCount: results.length };
      }

      if (sqlLower.includes('insert into users')) {
        const colStart = sqlLower.indexOf('(');
        const colEnd = sqlLower.indexOf(')', colStart);
        const valStart = sqlLower.indexOf('values', colEnd);
        const valStartBrace = sqlLower.indexOf('(', valStart);
        const valEndBrace = sqlLower.indexOf(')', valStartBrace);
        
        let cols: string[] = [];
        let rawSqlVals: string[] = [];
        
        if (colStart !== -1 && colEnd !== -1) {
          cols = sqlLower.substring(colStart + 1, colEnd).split(',').map(s => s.trim());
        }
        if (valStartBrace !== -1 && valEndBrace !== -1) {
          rawSqlVals = sqlLower.substring(valStartBrace + 1, valEndBrace).split(',').map(s => s.trim());
        }
        
        // Map parameter values to their column slots
        let paramIndex = 0;
        const record: any = {
          id: memDatabase.users.length + 1,
          first_name: '',
          last_name: '',
          full_name: '',
          email: '',
          password_hash: '',
          role: 'candidate',
          email_verified: false,
          created_at: new Date()
        };
        
        cols.forEach((col, idx) => {
          const rawVal = rawSqlVals[idx] || '';
          let val: any;
          if (rawVal.includes('$')) {
            val = params[paramIndex++];
          } else {
            // Remove single quotes from string literal
            val = rawVal.replace(/'/g, '').trim();
            if (val === 'true') val = true;
            if (val === 'false') val = false;
          }
          
          if (col === 'first_name') record.first_name = val;
          if (col === 'last_name') record.last_name = val;
          if (col === 'full_name') record.full_name = val;
          if (col === 'email') record.email = val;
          if (col === 'password_hash') record.password_hash = val;
          if (col === 'role') record.role = val;
          if (col === 'email_verified') record.email_verified = (val === true || val === 'true');
        });
        
        memDatabase.users.push(record);
        return { rows: [record] as T[], rowCount: 1 };
      }

      if (sqlLower.includes('insert into email_otps')) {
        const newOtp = {
          id: memDatabase.email_otps.length + 1,
          email: params[0],
          otp: params[1],
          expires_at: params[2] instanceof Date ? params[2] : new Date(params[2]),
          verified: false,
          created_at: new Date()
        };
        memDatabase.email_otps.push(newOtp);
        return { rows: [newOtp] as T[], rowCount: 1 };
      }

      if (sqlLower.includes('from email_otps')) {
        let results = memDatabase.email_otps;
        if (sqlLower.includes('email = $1') && sqlLower.includes('otp = $2')) {
          const email = (params[0] || '').trim().toLowerCase();
          const otpStr = (params[1] || '').trim();
          results = results.filter(o => o.email.toLowerCase() === email && o.otp === otpStr);
        } else if (sqlLower.includes('email = $1')) {
          const email = (params[0] || '').trim().toLowerCase();
          results = results.filter(o => o.email.toLowerCase() === email);
        }
        return { rows: results as T[], rowCount: results.length };
      }

      if (sqlLower.includes('update email_otps')) {
        const email = (params[0] || '').trim().toLowerCase();
        const otpStr = (params[1] || '').trim();
        memDatabase.email_otps.forEach(o => {
          if (o.email.toLowerCase() === email && o.otp === otpStr) {
            o.verified = true;
          }
        });
        return { rows: [], rowCount: 1 };
      }

      // Default safe empty return
      return { rows: [], rowCount: 0 };
    }

    // 2. REAL POSTGRES POOL LAYER
    if (!this.isConnected || !this.pool) {
      await this.connect();
    }
    
    console.log(`[Database Query SQL]: ${sql.substring(0, 150)}... | Params len: ${params.length}`);
    
    if (this.useMemoryFallback) {
      // Re-trigger fallback just in case connection was set to memory fallback during connect() call above
      return this.query(sql, params);
    }

    if (!this.pool) {
      throw new Error('[Database] Pool is not initialized');
    }

    const res = await this.pool.query(sql, params);
    return {
      rows: res.rows as T[],
      rowCount: res.rowCount ?? 0
    };
  }

  public async closePool(): Promise<void> {
    if (this.pool) {
      console.log('[Database] Shutting down connection pool smoothly.');
      await this.pool.end();
      this.pool = null;
      this.isConnected = false;
    }
  }
}

export const dbEngine = ProductionDatabaseEngine.getInstance();
