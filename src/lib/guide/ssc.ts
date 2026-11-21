import type { Lesson } from "./types";

// Academic lessons for the SSC courses (ICTO, LCC, Navy IT, PAF IT). They share ten past-paper banks ("pp" banks), so one set of lessons serves all four.
// Subnetting is a full "how to solve" lesson. The others are quick-facts pages: short facts written from what the past questions asked and answered,
// followed by the full list of past questions with answers, built from the bank itself.
// Facts follow the readability rules: one idea per line, the key word in [[bold]] (see markup.ts). guide.test.ts checks the length of every fact.

const ssc = (id: string, rest: Omit<Lesson, "group" | "practice" | "id">): Lesson => ({
  ...rest,
  id,
  group: "ssc",
  practice: { default: { bank: `academic-{course}-pp-${id}` } },
});

const allQuestions = (bank: string) => ({ kind: "bankFacts" as const, title: "Every past question, with its answer", bank });

export const SSC_LESSONS: Lesson[] = [
  ssc("subnetting", {
    title: "Subnetting",
    summary: "IP class, subnet masks, network and broadcast addresses, hosts and subnets.",
    minutes: 8,
    blocks: [
      {
        kind: "table",
        title: "Step 0: the class comes from the first number",
        head: ["Class", "First number", "Normal mask"],
        rows: [
          ["A", "1 to 126", "/8  (255.0.0.0)"],
          ["B", "128 to 191", "/16  (255.255.0.0)"],
          ["C", "192 to 223", "/24  (255.255.255.0)"],
          ["D", "224 to 239", "multicast"],
          ["E", "240 to 255", "reserved"],
        ],
        note: "127 is kept for the computer itself. Example: in 22.10.10.5/24 the first number is 22, so it is Class A.",
      },
      {
        kind: "steps",
        title: "The 4 steps for any /n question",
        steps: [
          { head: "Write the mask.", text: "n ones, then zeros. Each full group of 8 ones is 255. The leftover ones give 128, 192, 224, 240, 248 or 252 (see the table below). Example: /26 is 24 + 2, so the mask is 255.255.255.192." },
          { head: "Count the hosts.", text: "Host bits = 32 - n. Usable hosts = 2 to the power of the host bits, minus 2. Example: /26 has 6 host bits, so 2 x 2 x 2 x 2 x 2 x 2 - 2 = 62." },
          { head: "Find the jump.", text: "Look at the one number in the mask that is not 255 or 0. The jump is 256 minus that number. Blocks of that size start at 0. Example: 256 - 192 = 64, so the blocks start at 0, 64, 128, 192." },
          { head: "Place your address.", text: "Network address = the start of its block. Broadcast = the start of the next block minus 1. First usable = network + 1. Last usable = broadcast - 1." },
        ],
      },
      {
        kind: "table",
        title: "Learn this small table",
        head: ["Prefix", "Mask number", "Jump", "Hosts"],
        rows: [
          ["/25", "128", "128", "126"],
          ["/26", "192", "64", "62"],
          ["/27", "224", "32", "30"],
          ["/28", "240", "16", "14"],
          ["/29", "248", "8", "6"],
          ["/30", "252", "4", "2"],
        ],
        note: "These are for the last number of the mask. The same mask numbers work one number to the left for /17 to /22 (/17 is 128, /18 is 192, /19 is 224, /20 is 240, /21 is 248, /22 is 252) and /23 is 254. There the jump is in the third number and the hosts are much bigger (for example /22 gives 1022 hosts).",
      },
      {
        kind: "examples",
        title: "Placing an address",
        items: [
          {
            prompt: "22.10.10.5/24",
            lines: [
              "Class A (first number 22). The mask is 255.255.255.0 and there are 8 host bits: 2^8 - 2 = 254 hosts.",
              "Network 22.10.10.0. First usable 22.10.10.1. Last usable 22.10.10.254. Broadcast 22.10.10.255.",
            ],
            answer: "Network 22.10.10.0, broadcast 22.10.10.255",
          },
          {
            prompt: "What is the broadcast address for the subnet 192.168.5.64/26?",
            lines: ["Mask 255.255.255.192, jump 256 - 192 = 64.", "Blocks start at 0, 64, 128, 192. The address is in the block that starts at 64, and the next block starts at 128.", "Broadcast = 128 - 1 = 127."],
            answer: "192.168.5.127",
          },
          {
            prompt: "What is the subnet address of the IP 172.20.15.25/20?",
            lines: ["/20 is 16 + 4, so the mask is 255.255.240.0. The jump is in the third number: 256 - 240 = 16.", "Third-number blocks start at 0, 16, 32 ... The third number here is 15, which sits in the block that starts at 0."],
            answer: "172.20.0.0 (broadcast 172.20.15.255)",
          },
          {
            prompt: "What is the last usable IP address in the subnet 172.16.50.0/23?",
            lines: ["/23 is 16 + 7, so the mask is 255.255.254.0. The jump in the third number is 256 - 254 = 2.", "The block is 50 to 51, and the next block starts at 52, so the broadcast is 172.16.51.255.", "Last usable = broadcast - 1."],
            answer: "172.16.51.254",
          },
        ],
      },
      {
        kind: "steps",
        title: "Counting subnets",
        steps: [
          { head: "Borrowed bits.", text: "Subnets = 2 to the power of (new prefix - starting prefix). The starting prefix is the one the question names (\"from a /24 network\"), or the class default (A /8, B /16, C /24) when it only gives an address." },
          { head: "\"At least X hosts\".", text: "Find the smallest number of host bits whose hosts are X or more (2 to the power of the bits, minus 2). The new prefix is 32 minus those bits." },
          { head: "\"Create N subnets\".", text: "Find the power of 2 that gives N (8 is 2 x 2 x 2, so 3 bits). Add those bits to the starting prefix." },
        ],
      },
      {
        kind: "examples",
        title: "Counting hosts and subnets",
        items: [
          { prompt: "How many subnets and hosts per subnet can you get from the network 172.16.0.0/20?", lines: ["172 is Class B, so the starting prefix is /16. Borrowed bits: 20 - 16 = 4, so 2^4 = 16 subnets.", "Host bits: 32 - 20 = 12, so 2^12 - 2 = 4094 hosts."], answer: "16 subnets, 4094 hosts" },
          { prompt: "How many subnets and hosts per subnet from 10.0.0.0/24 if you use the mask 255.255.255.224?", lines: ["The mask 224 is /27. Borrowed bits: 27 - 24 = 3, so 2^3 = 8 subnets.", "Host bits: 5, so 2^5 - 2 = 30 hosts."], answer: "8 subnets, 30 hosts" },
          { prompt: "Given 172.16.0.0/16, what is the maximum number of subnets if each subnet must have at least 1000 hosts?", lines: ["9 host bits give only 510 hosts. 10 host bits give 1022, which is enough.", "New prefix: 32 - 10 = /22. Borrowed bits: 22 - 16 = 6, so 2^6 subnets."], answer: "64" },
          { prompt: "How many subnets can you create with a /24 network if you need at least 50 hosts per subnet?", lines: ["5 host bits give 30 hosts (too few). 6 host bits give 62.", "New prefix: 32 - 6 = /26. Borrowed bits: 26 - 24 = 2, so 2^2 subnets."], answer: "4" },
          { prompt: "What is the new subnet mask if you want to create 8 subnets from a /24 network?", lines: ["8 subnets need 3 bits (2 x 2 x 2).", "/24 + 3 = /27."], answer: "/27" },
        ],
      },
      {
        kind: "facts",
        title: "Words the papers also ask",
        groups: [
          { title: "Meaning", facts: ["A [[subnet mask]] divides an IP address into the network part and the host part.", "[[Subnetting]] means dividing a network into several smaller networks.", "[[CIDR]] notation (like /24) is a shorter way to write the subnet mask."] },
          { title: "Default masks", facts: ["[[Class A]]: 255.0.0.0", "[[Class B]]: 255.255.0.0", "[[Class C]]: 255.255.255.0"] },
        ],
      },
      { kind: "text", title: "The easy case", paragraphs: ["When the mask is /8, /16 or /24, copy the network part and fill the rest with 0 for the network and 255 for the broadcast. For example, 10.0.0.0/16 has broadcast 10.0.255.255."] },
      { kind: "watch", text: "Subtract 2 from the hosts. The network address and the broadcast address cannot be given to a computer." },
    ],
  }),

  ssc("security", {
    title: "Security",
    summary: "Encryption, malware and attacks, passwords, firewalls and the CIA goals.",
    minutes: 5,
    blocks: [
      {
        kind: "facts",
        title: "What repeats inside Security",
        note: "One past question can fit more than one group, so the counts overlap.",
        groups: [
          {
            title: "Encryption and hashing",
            match: "encrypt|decrypt|cipher|symmetric|\\brsa\\b|\\bhash|\\bsalt|signature|certificate|ssl|tls|https|checksum|aes|md5|sha",
            facts: [
              "[[Symmetric]] encryption uses one shared key.",
              "[[Asymmetric]] encryption uses a public key and a private key.",
              "[[RSA]] is asymmetric, so it is not a symmetric algorithm.",
              "A [[hash]] gives a fixed-length output. [[SHA-256]] is a hash function.",
              "[[MD5]] is weak because of collisions.",
              "[[Salting]] adds random data to a password before it is hashed.",
              "A [[digital signature]] shows a message is real and unchanged.",
              "A [[digital certificate]] verifies a website or a user.",
              "[[SSL/TLS]] encrypts web traffic and gives authentication.",
              "[[HTTPS]] is the secure web protocol. It uses port 443.",
              "A [[checksum]] detects errors in data being sent.",
            ],
          },
          {
            title: "Attacks and malware",
            match: "malware|virus|worm|trojan|ransom|keylog|logic bomb|zero-day|phishing|social engineering|\\bdos\\b|ddos|denial|man-in-the-middle|mitm|brute|evil twin|injection|buffer overflow|\\bapt\\b|attack",
            facts: [
              "[[Worm]]: copies itself and spreads to other computers.",
              "[[Trojan]]: hides inside software that looks real.",
              "[[Ransomware]]: locks or encrypts files and asks for money.",
              "[[Keylogger]]: records keystrokes.",
              "[[Logic bomb]]: runs only when a condition is met, such as a date.",
              "[[Polymorphic virus]]: changes its code to avoid detection.",
              "[[DoS]] floods a system with traffic so nobody can use it. [[DDoS]] means Distributed Denial of Service.",
              "[[Man-in-the-Middle]] intercepts and changes messages between two parties. HTTPS helps against it.",
              "[[Phishing]] uses fake emails or websites to steal personal information.",
              "[[Social engineering]] tricks people into giving away information.",
              "[[Brute force]] guesses a password with many tries.",
              "[[Zero-day]]: a flaw used before the vendor has fixed it.",
              "[[Evil twin]]: a fake Wi-Fi network.",
              "[[APT]] means Advanced Persistent Threat.",
              "[[SQL injection]] is stopped by input validation and parameterized queries.",
              "[[Buffer overflow]] uses insufficient memory allocation.",
            ],
          },
          {
            title: "Passwords and access",
            match: "authenticat|multi-?factor|\\bmfa\\b|2fa|two-factor|password|least privilege|biometric|fingerprint",
            facts: [
              "[[Multi-factor]] authentication mixes different proofs, such as a password and a fingerprint, or a fingerprint and a PIN.",
              "[[2FA]] adds a second layer of security.",
              "A strong password mixes upper and lower case letters, numbers and symbols.",
              "[[Least privilege]]: give users only the minimum access they need.",
            ],
          },
          {
            title: "Defences and tools",
            match: "firewall|\\bids\\b|intrusion|honeypot|\\bvpn\\b|virtual private|\\bdmz\\b|proxy|penetration|ethical hacker|\\bsiem\\b|\\bsoc\\b|wpa",
            facts: [
              "[[Firewall]]: monitors and controls incoming and outgoing traffic.",
              "A [[proxy firewall]] inspects traffic at the application layer.",
              "[[IDS]] (intrusion detection system) watches for suspicious activity and alerts people.",
              "[[Honeypot]]: a decoy that attracts attackers so they can be watched.",
              "[[VPN]] encrypts data sent over a network.",
              "[[DMZ]] separates an internal network from an outside one.",
              "[[Penetration test]]: finds weaknesses before attackers do.",
              "[[Ethical hacker]]: finds and fixes security holes.",
              "[[SIEM]] means Security Information and Event Management.",
              "[[SOC]] means Security Operations Center.",
              "[[WPA3]] is the most secure Wi-Fi protocol.",
            ],
          },
          {
            title: "The CIA goals",
            match: "\\bcia\\b|confidential|integrity|availability",
            facts: [
              "[[CIA]] means Confidentiality, Integrity and Availability.",
              "[[Confidentiality]]: only the right people see the information.",
              "[[Integrity]]: the information is not changed.",
              "[[Availability]]: the information is there when needed.",
              "[[Authorization]] is not one of the three CIA goals.",
            ],
          },
          {
            title: "Network helpers",
            match: "\\bdns\\b|\\bdhcp\\b|\\barp\\b|\\bping\\b|traceroute|osi|\\bhub\\b|\\bswitch\\b|\\bnat\\b|\\bqos\\b|\\bcdn\\b|load balancer|vlan|modem",
            facts: [
              "[[DNS]] turns domain names into IP addresses.",
              "[[DHCP]] gives out IP addresses automatically.",
              "[[ARP]] turns an IP address into a MAC address.",
              "[[ping]] checks that a host can be reached.",
              "[[traceroute]] shows the route packets take.",
              "The [[Presentation]] layer does encryption.",
              "A [[switch]] works at the Data Link layer.",
              "A [[hub]] works at the Physical layer.",
              "[[NAT]] is Network Address Translation.",
              "[[QoS]] puts important traffic first.",
              "A [[CDN]] delivers web content faster by caching it.",
            ],
          },
        ],
      },
      allQuestions("academic-icto-pp-security"),
    ],
  }),

  ssc("networks", {
    title: "Networks",
    summary: "Protocols and ports, the OSI layers, addresses, topologies and devices.",
    minutes: 4,
    blocks: [
      {
        kind: "facts",
        title: "Remember these",
        groups: [
          {
            title: "Protocols and what they do",
            facts: [
              "[[HTTP]] uses port 80.",
              "The HTTP [[POST]] method submits data to the server.",
              "[[200 OK]] means the request worked.",
              "[[FTP]] transfers files between computers. [[SFTP]] does it securely.",
              "[[SMTP]] sends email. [[IMAP]] retrieves email from a server.",
              "[[SSH]] is secure remote login. [[RDP]] is remote desktop.",
              "[[DNS]] turns domain names into IP addresses.",
              "[[SNMP]] is for network management and monitoring.",
              "[[NTP]] keeps time in step.",
              "[[UDP]] is connectionless and used for real-time work.",
              "[[TCP]] sets up a reliable connection with a three-way handshake.",
              "[[ICMP]] is Internet Control Message Protocol. [[BGP]] is Border Gateway Protocol.",
              "[[RIP]] uses hop count.",
              "[[ping]] checks that a host is reachable and measures the round trip.",
            ],
          },
          {
            title: "The layers",
            facts: [
              "The [[Network]] layer routes packets and handles logical addressing.",
              "The [[Transport]] layer does end-to-end communication and error checking.",
              "The [[Session]] layer starts, manages and ends connections.",
              "[[Session]] is not a layer of the TCP/IP model.",
            ],
          },
          {
            title: "Addresses",
            facts: [
              "[[IPv4]] has a limited address space. IPv6 solves this.",
              "[[IPv6]] has 128-bit addresses and uses multicast instead of broadcast.",
              "A [[MAC address]] is a unique identifier for a network interface.",
              "An [[IP address]] identifies a device on a network.",
              "[[NAT]] is Network Address Translation.",
              "[[10.0.0.1]] is a Class A address. [[192.168.1.1]] is Class C.",
              "The Ethernet [[MTU]] is 1500 bytes.",
              "The biggest IPv4 packet is [[64 KB]].",
              "A [[CAT5e]] segment can be 100 metres long.",
            ],
          },
          {
            title: "Topologies and devices",
            facts: [
              "[[Mesh]] is the most fault-tolerant and needs the most cabling.",
              "[[Ring]] connects devices in a circle. [[Bus]] connects them in a line.",
              "A [[router]] connects two different networks.",
              "A [[switch]] connects devices inside one local network.",
              "A [[repeater]] extends a wireless network.",
              "A [[modem]] is needed for the Internet connection.",
              "A [[VLAN]] splits a network logically.",
              "A [[load balancer]] spreads traffic across servers.",
              "A [[proxy server]] filters and caches requests.",
              "[[Fiber optic]] cable gives greater distance and higher speed.",
            ],
          },
          {
            title: "Wireless and short forms",
            facts: [
              "[[802.11n]] works at 2.4 GHz and 5 GHz. [[802.11a]] works at 5 GHz.",
              "[[SSID]] is Service Set Identifier.",
              "[[LAN]] is Local Area Network. [[WAN]] is Wide Area Network.",
              "[[TCP]] is Transmission Control Protocol. [[QoS]] is Quality of Service.",
              "[[ICANN]] coordinates the internet naming system.",
            ],
          },
        ],
      },
      allQuestions("academic-icto-pp-networks"),
    ],
  }),

  ssc("databases", {
    title: "Databases",
    summary: "Keys, SQL commands, normalization, transactions and NoSQL.",
    minutes: 3,
    blocks: [
      {
        kind: "facts",
        title: "Remember these",
        groups: [
          {
            title: "Keys and tables",
            facts: [
              "A [[primary key]] uniquely identifies each row.",
              "A [[foreign key]] creates a relationship between tables.",
              "[[UNIQUE]] makes sure all values in a column are different.",
              "A [[relational]] database stores data in tables of rows and columns.",
            ],
          },
          {
            title: "SQL",
            facts: [
              "[[SQL]] means Structured Query Language.",
              "[[SELECT]] retrieves data.",
              "[[DISTINCT]] removes duplicate records from a result.",
              "[[HAVING]] filters grouped (aggregated) data.",
              "[[ORDER BY]] sorts in ascending order by default.",
              "[[ALTER TABLE]] adds a new column.",
              "[[DROP]] deletes a table and its data for good.",
              "[[JOIN]] links two tables in a query.",
            ],
          },
          {
            title: "Design and speed",
            facts: [
              "[[Normalization]] reduces data redundancy and improves consistency.",
              "[[ACID]] is the set of properties of a transaction.",
              "An [[index]] speeds up data retrieval.",
              "A [[view]] is a virtual table made from a query.",
              "A [[materialized view]] stores a physical copy of the results.",
            ],
          },
          {
            title: "Other data systems",
            facts: [
              "[[NoSQL]] is highly scalable and flexible. It handles unstructured data.",
              "[[MongoDB]] is document-based.",
              "[[OLTP]] is for transaction processing. [[OLAP]] is for data analysis.",
              "[[Big Data]] means datasets too large for traditional databases.",
              "[[Amazon RDS]] is a cloud-based database.",
            ],
          },
        ],
      },
      allQuestions("academic-icto-pp-databases"),
    ],
  }),

  ssc("software-engineering", {
    title: "Software engineering",
    summary: "Agile and DevOps, design patterns, testing, version control and services.",
    minutes: 3,
    blocks: [
      {
        kind: "facts",
        title: "Remember these",
        groups: [
          {
            title: "Agile and DevOps",
            facts: [
              "[[Agile]] delivers small working pieces often (iterative and incremental).",
              "[[Agile]] suits changing requirements.",
              "Heavy documentation is [[not]] an Agile feature.",
              "[[DevOps]] means continuous integration and deployment, with teams working together.",
              "In the SDLC, the [[planning]] phase covers feasibility studies and gathering requirements.",
            ],
          },
          {
            title: "Design and code quality",
            facts: [
              "A [[design pattern]] is a reusable solution to a common problem.",
              "[[Singleton]] makes sure only one instance of a class is created.",
              "[[KISS]] means Keep It Simple, Stupid. It helps keep software maintainable.",
              "[[MVC]] means Model View Controller. The business logic lives in the Model.",
              "[[Functional]] programming uses functions as the main building blocks.",
              "[[C++]] is known for high performance in system-level software.",
            ],
          },
          {
            title: "Testing and version control",
            facts: [
              "[[Unit testing]] tests individual components on their own.",
              "[[Boundary value analysis]] tests values at the edges of input ranges.",
              "A [[version control system]] tracks changes in source code.",
              "[[git pull]] retrieves changes from a remote repository.",
            ],
          },
          {
            title: "Services",
            facts: [
              "[[REST]] is Representational State Transfer.",
              "[[API]] is Application Programming Interface.",
              "In microservices, an [[API gateway]] manages service communication.",
              "[[Monolithic deployment]] is not a microservices feature.",
            ],
          },
        ],
      },
      allQuestions("academic-icto-pp-software-engineering"),
    ],
  }),

  ssc("os-linux", {
    title: "OS and Linux",
    summary: "Scheduling, memory, deadlock and the Linux commands the papers ask.",
    minutes: 3,
    blocks: [
      {
        kind: "facts",
        title: "Remember these",
        groups: [
          {
            title: "Scheduling",
            facts: [
              "[[Round Robin]] gives each process a fixed time slice. It is preemptive.",
              "[[Shortest Job Next]] can cause starvation.",
              "The [[kernel]] schedules processes.",
            ],
          },
          {
            title: "Processes and memory",
            facts: [
              "[[Threads]] share the same memory space. [[Processes]] do not.",
              "[[Paging]] maps virtual addresses to physical addresses.",
              "A [[page fault]] happens when a needed page is not in physical memory.",
              "[[Thrashing]] is frequent swapping of pages between memory and disk.",
              "[[Segmentation]] divides memory into segments.",
            ],
          },
          {
            title: "Locks and deadlock",
            facts: [
              "A [[mutex]] lets only one thread use a resource at a time.",
              "A [[semaphore]] is used for process synchronization.",
              "The [[Banker's Algorithm]] is used for deadlock avoidance.",
            ],
          },
          {
            title: "Linux commands",
            facts: ["[[ls]] lists files and directories.", "[[grep]] finds text in files.", "[[chmod]] changes file permissions.", "[[apt-get]] installs software packages."],
          },
          {
            title: "Basics",
            facts: [
              "The [[operating system]] manages the hardware resources.",
              "[[RAID]] means Redundant Array of Independent Disks.",
              "The [[ALU]] (arithmetic and logic unit) is part of the CPU.",
            ],
          },
        ],
      },
      allQuestions("academic-icto-pp-os-linux"),
    ],
  }),

  ssc("computer-basics", {
    title: "Computer basics",
    summary: "Memory, short forms, keys, and a few history facts.",
    minutes: 3,
    blocks: [
      {
        kind: "facts",
        title: "Remember these",
        groups: [
          {
            title: "Memory and units",
            facts: [
              "[[RAM]] is temporary storage for running programs and data. It works directly with the CPU.",
              "[[BIOS]] means Basic Input Output System.",
              "[[1 byte]] is 8 bits.",
              "A 3.5 inch [[floppy disk]] held 1.44 MB.",
            ],
          },
          {
            title: "Short forms",
            facts: [
              "[[URL]]: Uniform Resource Locator.",
              "[[MICR]]: Magnetic ink character recognition.",
              "[[EBCDIC]]: Extended Binary Coded Decimal Interchange Code.",
              "[[CAD]]: Computer aided design.",
              "[[UNIVAC]]: Universal Automatic Computer.",
            ],
          },
          {
            title: "Keys and everyday computing",
            facts: [
              "[[Esc]] closes a drop-down list or cancels a command.",
              "[[F12]] opens the Save As box.",
              "In Microsoft Access, rows are called [[records]].",
              "[[Folders]] are used to organise files.",
              "Data becomes [[information]] when it is shown in a form people can understand and use.",
              "A [[peripheral device]] is equipment added to a computer.",
              "A [[light pen]] is an optical input device.",
              "[[WAV]] is a type of sound file.",
            ],
          },
          {
            title: "History",
            facts: ["The word \"computer\" was first used in [[1613]].", "The ALU has [[2 units]].", "[[William Oughtred]] invented the slide rule."],
          },
        ],
      },
      allQuestions("academic-icto-pp-computer-basics"),
    ],
  }),

  ssc("programming-web", {
    title: "Programming and web",
    summary: "Object-oriented ideas, languages and translators, and web basics.",
    minutes: 3,
    blocks: [
      {
        kind: "facts",
        title: "Remember these",
        groups: [
          {
            title: "Object-oriented ideas",
            facts: [
              "[[Polymorphism]] means multiple forms (overloading and overriding methods).",
              "[[Encapsulation]] hides the details of a class from outside.",
              "[[Object-oriented]] is the paradigm of OOP.",
            ],
          },
          {
            title: "Languages and tools",
            facts: [
              "[[Dennis Ritchie]] is the father of the C language.",
              "[[JavaScript]] is an interpreted language.",
              "A [[compiler]] converts source code into machine code.",
              "An [[assembler]] turns assembly language into machine code.",
              "[[npm]] is the Node Package Manager.",
              "[[React Native]] is used for cross-platform mobile apps.",
              "[[Python]] is often used for scripting in web development.",
            ],
          },
          {
            title: "Web basics",
            facts: [
              "[[HTML]] is Hyper Text Markup Language.",
              "[[CSS]] is Cascading Style Sheet.",
              "[[Responsive design]] means a site adapts to different screen sizes and devices.",
              "A [[cookie]] is a small piece of data stored on a user's device.",
            ],
          },
          {
            title: "Small facts",
            facts: ["In Java, the [[finally]] block runs whether or not an exception is thrown.", "In Python, 2 ** 3 ** 2 is 512.", "The ** sign works from the right: 3 ** 2 is 9, then 2 ** 9."],
          },
        ],
      },
      allQuestions("academic-icto-pp-programming-web"),
    ],
  }),

  ssc("data-structures", {
    title: "Data structures",
    summary: "Stack and queue, speed of algorithms, trees and graphs.",
    minutes: 3,
    blocks: [
      {
        kind: "facts",
        title: "Remember these",
        groups: [
          {
            title: "Stack and queue",
            facts: [
              "A [[stack]] is LIFO (last in, first out).",
              "A stack is used in recursion.",
              "A [[queue]] is FIFO (first in, first out).",
              "A queue is used in breadth-first search (BFS).",
            ],
          },
          {
            title: "Speed of algorithms",
            facts: [
              "[[Binary search]] on a sorted array is O(log n).",
              "[[Quick Sort]] in its best case is O(n log n).",
              "[[Insertion sort]] in its worst case is O(n squared).",
              "[[Bubble sort]] is also O(n squared) in the worst case but works well on small data.",
            ],
          },
          {
            title: "Trees and graphs",
            facts: [
              "A [[tree]] keeps data in a hierarchy.",
              "An [[AVL tree]] stays balanced by keeping the heights of its subtrees close.",
              "[[Dijkstra's algorithm]] finds shortest paths in graphs.",
              "In a [[heap]] the elements are not stored in sorted order.",
            ],
          },
          {
            title: "Lists and expressions",
            facts: ["A [[doubly linked list]] can be walked in both directions.", "A [[postfix]] expression is evaluated from left to right."],
          },
        ],
      },
      allQuestions("academic-icto-pp-data-structures"),
    ],
  }),

  ssc("cloud-ai", {
    title: "Cloud and AI",
    summary: "Cloud service models, elasticity, containers and the basics of machine learning.",
    minutes: 3,
    blocks: [
      {
        kind: "facts",
        title: "Remember these",
        groups: [
          {
            title: "Service models",
            facts: [
              "[[SaaS]] is Software as a Service.",
              "[[PaaS]] gives a platform for developing applications.",
              "[[IaaS]] gives virtualized computing resources and the most control to the user.",
            ],
          },
          {
            title: "Cloud ideas",
            facts: [
              "[[Elasticity]] means scaling resources up or down on demand.",
              "[[Serverless]] means applications run without you managing the servers.",
              "[[Docker]] underpins containerization.",
              "A [[hybrid cloud]] combines public and private cloud.",
              "Key advantages are high scalability and cost efficiency.",
              "Limited access to applications is [[not]] a benefit.",
            ],
          },
          {
            title: "AI and data",
            facts: [
              "[[Regression]] is a type of supervised learning.",
              "A [[decision tree]] is a good algorithm for classification.",
              "[[Reinforcement learning]] lets a machine learn from experience.",
              "[[IoT]] means Internet of Things.",
            ],
          },
        ],
      },
      allQuestions("academic-icto-pp-cloud-ai"),
    ],
  }),
];
