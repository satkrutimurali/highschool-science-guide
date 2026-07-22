(function (global) {
  const curriculumBank = {
    "science 9": {
      title: "Science 9",
      firstUnit: "In a typical BC Science 9 course, the first unit is Scientific Inquiry and Lab Skills. It introduces how to ask questions, make observations, use equipment safely, and analyze evidence.",
      unitSummary: "Science 9 usually explores cells and reproduction, matter and chemical change, energy transfer, and Earth and space systems.",
      prepTips: "To prepare for Science 9, review basic lab safety, scientific vocabulary, and how to read graphs or data tables. Practice identifying variables and writing a clear hypothesis.",
      skills: ["Cells and reproduction", "Matter and chemical change", "Energy transfer and conservation", "Earth and space science"],
      habits: ["What observations can you make from the question?", "What do you already know about the system or process?"]
    },
    "science 10": {
      title: "Science 10",
      firstUnit: "In a typical BC Science 10 course, the first unit is often Scientific Inquiry and Lab Skills, then a course-specific foundation unit. The exact order can vary by teacher.",
      unitSummary: "Science 10 usually brings together genetics, chemical change, motion, and climate systems so students can connect theory to real-world patterns.",
      prepTips: "To prepare for Science 10, review graphing, formulas, scientific notation, and the difference between independent and dependent variables. Be ready to explain cause-and-effect relationships.",
      skills: ["Genetics and evolution", "Chemical reactions and energy", "Motion and force", "Climate and weather"],
      habits: ["What is the variable you are trying to explain or calculate?", "Can you name the key scientific relationship involved?"]
    },
    "biology 11": {
      title: "Biology 11",
      firstUnit: "The first unit in Biology 11 is often an introduction to biology, scientific thinking, and foundational cell concepts. This is a setup unit for the rest of the course.",
      unitSummary: "Biology 11 usually includes cell biology, ecology, evolution, plant and animal systems, and how organisms interact with their environments.",
      prepTips: "To prepare for Biology 11, review cell structure, basic chemistry, and the meaning of terms like organism, ecosystem, and adaptation. A good habit is to list the parts of the system before trying to explain the function.",
      skills: ["Cell biology", "Plants and animals", "Ecology", "Evolution and taxonomy"],
      habits: ["What organism, cell, or ecosystem is involved?", "Which biological process connects the parts of the question?"]
    },
    "chemistry 11": {
      title: "Chemistry 11",
      firstUnit: "The first unit in Chemistry 11 is commonly an introduction to atomic structure, bonding, and the language of chemistry. This builds the foundation needed for reactions and calculations.",
      unitSummary: "Chemistry 11 usually covers atoms, ions, moles, bonding, reactions, and acids and bases.",
      prepTips: "To prepare for Chemistry 11, review basic atomic theory, element symbols, and simple arithmetic with units. Make sure you can identify the number of particles and the quantity being asked for in a problem.",
      skills: ["Atoms and ions", "Moles and stoichiometry", "Chemical bonding", "Acids and bases"],
      habits: ["What type of particle or reaction is being discussed?", "Which quantities are given, and which one are you solving for?"]
    },
    "physics 11": {
      title: "Physics 11",
      firstUnit: "A typical Physics 11 course begins with measurement, motion, and vectors. That gives you the mathematical language needed for forces, energy, and waves.",
      unitSummary: "Physics 11 often covers kinematics, forces, energy, work, and wave behaviour.",
      prepTips: "To prepare for Physics 11, review unit conversions, formulas, and how to interpret graphs. It helps to identify what quantity is being asked for before choosing a formula.",
      skills: ["Kinematics", "Forces and Newton's laws", "Energy and work", "Waves and sound"],
      habits: ["What quantities are in the problem: distance, speed, force, mass, or energy?", "Which physics law or relationship best fits the scenario?"]
    },
    "biology 12": {
      title: "Biology 12",
      firstUnit: "In Biology 12, the first unit is often cell biology and cell processes, including membranes and transport. This forms the base for the rest of the course.",
      unitSummary: "Biology 12 usually includes cell membranes, DNA and protein synthesis, homeostasis, and human organ systems.",
      prepTips: "To prepare for Biology 12, review the cell membrane, organelles, and the roles of key body systems. Try to explain each process in your own words rather than memorizing only the textbook wording.",
      skills: ["Cell membranes and transport", "DNA, protein synthesis, and genetics", "Homeostasis", "Human organ systems"],
      habits: ["What system is carrying out the function?", "What evidence from the question helps you decide the mechanism?"]
    },
    "chemistry 12": {
      title: "Chemistry 12",
      firstUnit: "In Chemistry 12, the first unit is usually introduced through reaction rates and chemical equilibrium, since these ideas connect strongly to later units.",
      unitSummary: "Chemistry 12 often covers reaction rates, equilibrium, solubility, and electrochemistry.",
      prepTips: "To prepare for Chemistry 12, review reaction notation, the meaning of rate, and the difference between forward and reverse reactions. It is useful to write the system out in words before calculating.",
      skills: ["Reaction rates", "Equilibrium", "Solubility", "Electrochemistry"],
      habits: ["What is changing in the system over time?", "What condition or factor is most important for the outcome?"]
    },
    "physics 12": {
      title: "Physics 12",
      firstUnit: "Physics 12 often starts with momentum, collisions, and conservation laws, since these provide a strong framework for later electricity and modern physics topics.",
      unitSummary: "Physics 12 usually includes momentum, electricity and circuits, magnetism, and modern physics.",
      prepTips: "To prepare for Physics 12, review conservation laws, algebra, and your earlier work with forces and energy. Drawing a simple diagram can often reveal what quantity is conserved.",
      skills: ["Momentum and collisions", "Electricity and circuits", "Magnetism", "Modern physics"],
      habits: ["What is conserved in the situation?", "Which diagram, law, or formula would help you organize the information?"]
    }
  };

  const subjectKeywords = {
    biology: ["cell", "gene", "dna", "plant", "animal", "ecosystem", "evolution", "organism", "homeostasis", "membrane"],
    chemistry: ["mole", "atom", "bond", "reaction", "acid", "base", "ph", "equilibrium", "solubility", "stoichiometry", "molecule", "electron"],
    physics: ["force", "motion", "velocity", "acceleration", "energy", "mass", "momentum", "circuit", "voltage", "current", "wave", "speed"],
    earth: ["weather", "climate", "planet", "space", "earth", "tectonic", "rock", "plate", "sun", "orbit"]
  };

  function hasWholeWord(text, keyword) {
    const pattern = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return pattern.test(text);
  }

  function chooseTopic(question) {
    const lower = question.toLowerCase();

    for (const [topic, config] of Object.entries(curriculumBank)) {
      const match = config.skills.some((skill) => hasWholeWord(lower, skill.toLowerCase()));
      if (match) return topic;
    }

    const score = {
      biology: 0,
      chemistry: 0,
      physics: 0,
      earth: 0
    };

    for (const [area, keywords] of Object.entries(subjectKeywords)) {
      for (const keyword of keywords) {
        if (hasWholeWord(lower, keyword)) score[area] += 1;
      }
    }

    const highest = Object.entries(score).sort((a, b) => b[1] - a[1])[0][0];

    if (highest === 'biology') return 'biology 11';
    if (highest === 'chemistry') return 'chemistry 11';
    if (highest === 'physics') return 'physics 11';
    return 'science 9';
  }

  function detectQuestionType(question) {
    const lower = question.toLowerCase();
    const curriculumMarkers = [
      'first unit',
      'unit overview',
      'what unit',
      'explain the unit',
      'how to prepare',
      'prepare for',
      'curriculum',
      'what should i study',
      'explain this unit',
      'unit summary',
      'what is my first unit',
      'what is the first unit'
    ];

    return curriculumMarkers.some((marker) => lower.includes(marker)) ? 'curriculum' : 'science';
  }

  function buildGuidedScienceReply(question, topic) {
    const config = curriculumBank[topic];
    const starter = `Let's work through this together in a ${config.title} way. Start by identifying the key idea in the question. Is it asking about a process, a relationship, a calculation, or a system?`;
    const prompt = `Try this first: What observations can you make from the question?`;
    const followUp = `After you answer that, think about: What do you already know about the system or process?`;

    return [
      starter,
      prompt,
      followUp,
      'When you are ready, share your idea and I will help you refine it without jumping straight to the answer.'
    ].join('\n\n');
  }

  function buildCurriculumDirectReply(question, topic) {
    const config = curriculumBank[topic];
    const lower = question.toLowerCase();

    if (lower.includes('first unit') || lower.includes('what is my first unit') || lower.includes('what is the first unit')) {
      return `${config.firstUnit}`;
    }

    if (lower.includes('prepare') || lower.includes('how to prepare')) {
      return `${config.prepTips}`;
    }

    if (lower.includes('explain') || lower.includes('unit summary') || lower.includes('unit overview')) {
      return `${config.unitSummary}`;
    }

    return `${config.firstUnit} ${config.prepTips}`;
  }

  function generateAnswer(question, selectedTopic = 'science 9') {
    const topic = chooseTopic(question);
    const questionType = detectQuestionType(question);

    if (questionType === 'curriculum') {
      return buildCurriculumDirectReply(question, selectedTopic || topic);
    }

    return buildGuidedScienceReply(question, topic);
  }

  const api = {
    curriculumBank,
    chooseTopic,
    detectQuestionType,
    generateAnswer
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.tutorLogic = api;
})(typeof window !== 'undefined' ? window : globalThis);
