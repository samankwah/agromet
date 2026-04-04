# KWAME NKRUMAH UNIVERSITY OF SCIENCE AND TECHNOLOGY

## COLLEGE OF SCIENCE

## FACULTY OF PHYSICAL AND COMPUTATIONAL SCIENCES

## DEPARTMENT OF COMPUTER SCIENCE

### PROJECT PROPOSAL

### DESIGN AND IMPLEMENTATION OF AN AI-POWERED AGRO-METEOROLOGICAL DECISION SUPPORT SYSTEM FOR CLIMATE-SMART FARMING IN GHANA

#### BY

`YOUR FULL NAME`  
`STUDENT ID`

### A PROJECT PROPOSAL SUBMITTED TO THE DEPARTMENT OF COMPUTER SCIENCE, KWAME NKRUMAH UNIVERSITY OF SCIENCE AND TECHNOLOGY, KUMASI, IN PARTIAL FULFILMENT OF THE REQUIREMENTS FOR THE AWARD OF THE DEGREE OF BSc. COMPUTER SCIENCE

`MONTH, YEAR`

---

# DECLARATION

I hereby declare that this project proposal is my own work towards the award of the Bachelor of Science degree in Computer Science and that, to the best of my knowledge, it contains no material previously published by another person except where due acknowledgment has been made.

**Student Name:** `YOUR FULL NAME`  
**Signature:** `....................`  
**Date:** `....................`

**Supervisor's Name:** `SUPERVISOR NAME`  
**Signature:** `....................`  
**Date:** `....................`

---

# ACKNOWLEDGEMENTS

I would like to express my sincere gratitude to God for His guidance and strength throughout this work. I am also deeply grateful to my supervisor, `SUPERVISOR NAME`, for the direction, support, and constructive feedback provided during the preparation of this proposal.

I further appreciate the lecturers of the Department of Computer Science, Kwame Nkrumah University of Science and Technology, for the knowledge and academic foundation they have provided. My thanks also go to my family, friends, and colleagues for their encouragement and support.

---

# TABLE OF CONTENTS

Use Word's automatic table of contents after applying heading styles. The expected main entries are:

1. Declaration
2. Acknowledgements
3. Abstract
4. Chapter One: Introduction
5. Chapter Two: Literature Review
6. Chapter Three: Methodology
7. References
8. Appendix A: Formatting Notes for Submission

---

# ABSTRACT

Agriculture in Ghana depends heavily on timely access to weather information, advisory content, and practical decision-making support. However, many farmers and agricultural stakeholders still rely on fragmented and delayed sources of information, making it difficult to plan planting, irrigation, disease control, and harvesting activities effectively. This project proposes the design and implementation of an AI-powered agro-meteorological decision support system known as AgroMet to address this challenge.

The proposed system will be a web-based platform that integrates weather information, agricultural advisory content, farm-related records, and a conversational AI assistant into a unified digital environment. The frontend will provide accessible interfaces for weather views, advisory access, dashboard management, and chatbot interaction, while the backend will provide secure API services, authentication, and data management functions. The system will be developed using React and Vite for the frontend, FastAPI for the backend, SQLite for data storage, and JWT for authentication.

The study is grounded in Computer Science through its focus on intelligent information systems, human-computer interaction, full-stack software engineering, and the practical application of artificial intelligence in a domain-specific setting. The completed work is expected to provide a usable software prototype and demonstrate how digital systems can improve access to agro-meteorological decision support in Ghana.

---

# CHAPTER ONE

## INTRODUCTION

### 1.1 Background of the Study

Agriculture remains a major contributor to Ghana's economy and a key source of livelihood for a large portion of the population. Farmers make critical decisions daily on planting periods, pest and disease management, irrigation, fertilizer application, harvesting, and market timing. Many of these decisions depend directly on weather conditions and access to timely agricultural advice. Weather and climate services have been identified as essential inputs for agricultural resilience and food security, especially in developing regions where access and delivery remain uneven (Dobardzic et al., 2019).

Despite the importance of this information, access to reliable and actionable support is still limited in many contexts. Weather updates, extension advice, and farm management information are often distributed across separate channels. In some situations, the information is not timely, not easy to interpret, or not tailored to immediate decision-making needs. This creates gaps that can negatively affect productivity, preparedness, and farm resilience. Evidence from Northern Ghana shows that although digital agricultural services are expanding, many smallholder farmers still rely on basic tools such as phones, radio, and intermediaries, while access to richer digital resources and sustained engagement remains limited (Abdulai et al., 2023).

Advances in web systems, application programming interfaces, and artificial intelligence make it possible to build software platforms that organize such information into a more accessible form. Agricultural decision support systems are increasingly viewed as a key part of Agriculture 4.0 because they combine multiple data streams and computational support to improve farming decisions (Zhai et al., 2020). Artificial intelligence also increasingly supports agricultural prediction, monitoring, and advisory tasks, but effective adoption still depends on usable system design and appropriate delivery contexts (Linaza et al., 2021; Sachithra & Subhashini, 2023). This project therefore proposes the development of AgroMet, an AI-powered web application designed to support climate-smart farming through intelligent digital advisory services.

### 1.2 Statement of the Problem

Farmers and agricultural stakeholders in Ghana often do not have access to a single digital platform that combines weather information, agricultural advisories, farm record support, and interactive guidance. Existing approaches are usually manual, fragmented, or difficult for end users to interpret. As a result, decisions on crop planning, poultry management, disease response, and other farm activities may be made with incomplete or poorly structured information.

Although several digital agriculture solutions exist, many do not adequately integrate localized weather support, advisory services, and conversational assistance in a way that is practical for the Ghanaian context. Reviews of digital agriculture in Africa note that many innovations remain fragmented, pilot-driven, or difficult to scale effectively for end users (Abate et al., 2023). Related research in Northern Ghana further suggests that low literacy, weak digital competencies, and limited internet access remain major barriers, which means system usefulness depends on simple, accessible, and context-aware design (Abdulai et al., 2023). There is therefore the need for a computer-based system that can intelligently manage and present agro-meteorological information for better decision-making.

### 1.3 Aim of the Study

The aim of this study is to design, implement, and evaluate an AI-powered agro-meteorological decision support system that provides weather-informed agricultural guidance through a web-based platform.

### 1.4 Objectives of the Study

The objectives of the study are to:

1. design and develop a full-stack web application for agro-meteorological information delivery;
2. integrate weather information, agricultural advisory content, and farm-related records into one platform;
3. implement an AI-powered chatbot for interactive question answering and farming support;
4. provide secure user authentication and dashboard-based management of advisory records; and
5. evaluate the usability and technical performance of the developed prototype.

### 1.5 Research Questions

The study will answer the following questions:

1. How can an AI-powered web system be designed to support agro-meteorological decision-making?
2. How can weather information and agricultural advisory data be integrated into a single platform for farmers and stakeholders?
3. How useful is a conversational AI assistant for agricultural information access and support?
4. How usable and technically effective is the developed system?

### 1.6 Significance of the Study

This study is significant because it applies Computer Science principles to solve a practical problem in agriculture. The project demonstrates how software engineering, secure backend services, data integration, and intelligent interfaces can be combined into a useful domain-specific system. Research on agricultural decision support highlights the importance of integrating usability, visualization, and interaction design so that end users can actually interpret and act on complex data outputs (Gutierrez et al., 2019). The work may also support farmers, agricultural officers, and content managers by improving access to structured weather-informed guidance. In addition, it can serve as a foundation for future work in digital agriculture, decision support systems, multilingual interfaces, and applied AI.

### 1.7 Scope of the Study

The study will focus on the design and implementation of a web-based agro-meteorological platform with the following features:

1. user registration, login, and authentication;
2. display of weather and forecast-related information;
3. crop and poultry advisory access and management;
4. agricultural data and content management through a dashboard; and
5. an AI chatbot for agricultural question answering and guidance.

The project will be evaluated as a software prototype. It will not include nationwide field deployment or long-term agronomic impact validation.

### 1.8 Organization of the Study

The remainder of the study will be organized as follows. Chapter Two will review relevant literature and related systems. Chapter Three will present the methodology, system design, implementation approach, and evaluation plan. In the final project report, later chapters will cover implementation results, discussion, conclusion, and recommendations.

---

# CHAPTER TWO

## LITERATURE REVIEW

### 2.1 Introduction

This chapter reviews literature relevant to the proposed study. It covers decision support systems, agricultural information systems, artificial intelligence in agriculture, conversational interfaces, and related digital platforms. The purpose is to establish the theoretical and practical basis for the design of the proposed AgroMet system.

### 2.2 Decision Support Systems

A decision support system is a computer-based system that helps users make informed decisions by combining data, models, and interactive tools. In many domains, decision support systems improve access to relevant information and assist users in evaluating possible actions. In agriculture, such systems are particularly useful because farming decisions often depend on multiple changing factors, including rainfall, temperature, pests, soil conditions, and crop timing. Survey work on agriculture 4.0 describes decision support systems as a core computational layer for processing meteorological, environmental, and farm data into actionable choices, while also highlighting requirements such as interoperability, accessibility, and usability (Zhai et al., 2020). Earlier reviews of web-based agricultural decision support similarly emphasize that high-quality information, modular design, and user interaction are central to effective support systems (Damos, 2015).

### 2.3 Agricultural Information Systems

Agricultural information systems are designed to collect, manage, and disseminate information that supports agricultural activities. These systems may include advisory services, forecast dissemination tools, farm management applications, market information systems, and extension support platforms. Their effectiveness depends not only on the quality of information but also on accessibility, clarity, and ease of use. Reviews of digital tools in African agriculture show that many systems promise transformation but often struggle with scale, sustained use, and fit with local constraints, especially where infrastructure and digital inclusion remain limited (Abate et al., 2023). For Northern Ghana in particular, digital agricultural engagement is still strongly mediated by low-cost channels and project-based outreach rather than full digital independence (Abdulai et al., 2023).

### 2.4 Artificial Intelligence in Agriculture

Artificial intelligence has increasingly been applied in agriculture for disease detection, yield prediction, recommendation systems, precision farming, and automated advisory support. Reviews of AI in agriculture show strong growth in machine learning, computer vision, and predictive analytics for decision support, optimization, and sustainability-related tasks (Linaza et al., 2021; Sachithra & Subhashini, 2023). AI techniques can improve how users access and interpret information, especially when integrated into interactive systems. In this project, AI is applied through a conversational assistant that can respond to agricultural questions and improve user interaction with the platform.

### 2.5 Conversational Interfaces and Chatbots

Chatbots provide users with a natural language interface for obtaining information and assistance. In educational, business, and health systems, chatbots have been used to simplify access to knowledge and reduce the effort required to navigate complex interfaces. A systematic review of chatbot interaction design found that chatbots can improve subjective satisfaction and access to support, but their usefulness depends on design quality, usability, and contextual adaptation (Kuhail et al., 2023). In agriculture, a chatbot can help users ask practical questions related to weather, crop management, and disease symptoms without requiring advanced technical knowledge.

### 2.6 Related Works

Several digital agriculture systems have been developed to improve access to farming information. Some focus on market prices, some on weather alerts, and others on farm records or advisory distribution. For example, cloud-based platforms such as AgroDSS demonstrate how data-driven services can provide predictive modeling and explanatory support for agricultural decision-making (Rupnik et al., 2019). However, many existing systems address only a subset of user needs. A key gap remains in the integration of weather support, advisory content, digital record management, and conversational assistance in one platform that is easy to use in the Ghanaian context.

### 2.7 Gap in Literature

From the reviewed literature, it is clear that while digital agriculture systems and AI applications continue to expand, fewer systems combine agro-meteorological information, advisory content, interactive support, and dashboard-based data management into a unified web application. The literature also shows persistent concerns around accessibility, interface design, and real-world adoption, particularly in low-resource settings (Abate et al., 2023; Gutierrez et al., 2019). This creates an opportunity for the proposed AgroMet system to contribute both practically and academically.

### 2.8 Conceptual Framework

The conceptual framework for this study is based on the idea that better agricultural decisions can be supported when multiple information sources are integrated into one intelligent system. In the proposed AgroMet platform, weather and forecast data, agricultural advisory content, farm-related records, and user queries form the major inputs. These inputs are processed through a full-stack decision support architecture made up of a frontend interface, backend services, database storage, and an AI chatbot layer.

The system processes these inputs into usable outputs such as weather-informed guidance, advisory content, managed records, and conversational responses. These outputs are expected to improve information accessibility, support timely decisions, and enhance user interaction with agricultural knowledge. The effectiveness of the system will then be evaluated in terms of usability, usefulness, responsiveness, and overall technical performance.

In summary, the framework assumes that:

1. integrated digital access to weather and advisory information improves information availability;
2. AI-based conversational support improves ease of interaction with the system; and
3. improved access and interaction lead to better decision support for users.

#### Conceptual Framework Diagram

```text
Inputs
- Weather and forecast data
- Agricultural advisory content
- Farm records and uploaded data
- User questions and interactions

          |
          v

Processing Layer
- React frontend interface
- FastAPI backend services
- SQLite data storage
- AI chatbot and response engine
- Authentication and dashboard management

          |
          v

Outputs
- Weather-informed guidance
- Advisory recommendations
- Managed agricultural records
- Conversational answers and support

          |
          v

Expected Outcomes
- Improved access to agricultural information
- Better user interaction with the system
- More timely and informed farm decision-making
- Usable prototype for agro-meteorological support
```

### 2.9 Summary of the Review

The literature shows that decision support systems, agricultural information systems, and conversational AI all have relevant roles in improving access to agricultural knowledge. The proposed project builds on these ideas by integrating them into a single platform designed for agro-meteorological support.

---

# CHAPTER THREE

## METHODOLOGY

### 3.1 Introduction

This chapter describes the methodology that will be used to design, implement, and evaluate the proposed system. It covers the development approach, system architecture, implementation tools, and evaluation methods.

### 3.2 Research Design

The study will adopt a design-and-implementation approach in which a software prototype will be developed to address the identified problem. The focus will be on translating user and domain requirements into a working intelligent web platform.

### 3.3 Requirements Analysis

The requirements for the system will be identified from the problem domain and supported by literature on agro-meteorological services, agricultural decision support, and user-centered software design. Both functional requirements and non-functional requirements will be considered. In particular, the design will reflect evidence that digital agricultural tools in Northern Ghana should remain accessible through simple interfaces and low-friction interaction patterns because user access to advanced digital resources is still uneven (Abdulai et al., 2023).

Functional requirements will include:

1. user authentication and authorization;
2. viewing weather-related information;
3. access to crop and poultry advisory content;
4. management of agricultural records and uploaded content;
5. chatbot-based question answering.

Non-functional requirements will include usability, reliability, maintainability, responsiveness, and security.

### 3.4 System Design

The system will follow a client-server architecture. The frontend will provide the user interface for interacting with the platform, while the backend will expose API endpoints for authentication, data storage, and chat-related services.

The major components of the system will include:

1. a React-based frontend for pages, dashboards, maps, and chatbot interaction;
2. a FastAPI backend for API routing and business logic;
3. a SQLite database for storing user and agricultural data; and
4. an AI integration layer for generating chatbot responses.

### 3.5 Implementation Tools and Technologies

The proposed system will be implemented using the following technologies:

1. **Frontend:** React and Vite;
2. **Backend:** FastAPI using Python;
3. **Database:** SQLite;
4. **Authentication:** JWT-based authentication;
5. **Development model:** modular full-stack web application design.

### 3.6 Evaluation Plan

The developed prototype will be evaluated through functional testing and expert review. The evaluation will consider:

1. whether the core system features work correctly;
2. how responsive and reliable the system is during use;
3. whether the interface is easy to navigate and understand; and
4. whether the chatbot and advisory components are useful to intended users.

Where possible, the system will be demonstrated to lecturers, supervisors, or agricultural officers for feedback on usefulness and usability. This evaluation focus is consistent with literature showing that adoption of agricultural decision support systems depends not only on technical capability but also on usability, trust, and fit with existing user workflows (Gutierrez et al., 2019; Zhai et al., 2020).

### 3.7 Expected Output

The expected output of the study is a functional software prototype that integrates agro-meteorological information, agricultural advisories, and AI-powered interaction in a single web platform. The system should provide a practical demonstration of how Computer Science methods can be applied to digital agriculture.

### 3.8 Summary

This chapter has presented the methodology for the proposed study, including the development approach, architecture, tools, and evaluation strategy. The next stage of the work will involve implementation and testing of the proposed AgroMet system.

---

# CHAPTER FOUR

## SYSTEM DESIGN, IMPLEMENTATION AND RESULTS

### 4.1 Introduction

This chapter presents the design, implementation, and expected operational results of the proposed AgroMet system. It describes the system architecture, major modules, implementation technologies, and the key outcomes expected from the developed prototype.

### 4.2 System Architecture

The AgroMet system follows a client-server architecture. The frontend provides the user-facing interface through which users access weather information, advisory content, dashboards, and chatbot interactions. The backend provides API endpoints for authentication, data access, chat processing, and administrative functions. A lightweight relational database stores user and agricultural data, while the AI layer supports conversational interaction.

At a high level, the architecture is organized as follows:

1. **Presentation Layer:** handles pages, forms, dashboards, maps, and chatbot interface components;
2. **Application Layer:** processes business logic, authentication, chat requests, and record management;
3. **Data Layer:** stores user details, uploaded records, and advisory-related data;
4. **Intelligence Layer:** supports conversational responses and domain-specific assistance.

### 4.3 System Modules

The proposed AgroMet platform consists of the following major modules:

#### 4.3.1 Authentication Module

This module handles user registration, login, and secure access control. JWT-based authentication is used to protect restricted routes and ensure that only authorized users can access management features.

#### 4.3.2 Weather Information Module

This module provides weather and forecast-related information for agricultural use. It allows users to view weather data that can support planning and risk awareness.

#### 4.3.3 Advisory Management Module

This module manages crop and poultry advisory content. It supports viewing, organizing, and administering advisory records through the application interface and dashboard.

#### 4.3.4 Agricultural Data Management Module

This module enables storage, upload, and management of agricultural records. It supports the organization of farm-related and advisory-related data in structured form for retrieval and use.

#### 4.3.5 Chatbot Module

This module provides conversational support to users. It allows users to ask questions about agricultural issues and receive responses through an AI-powered assistant integrated into the platform.

### 4.4 Implementation Technologies

The system is implemented using the following technologies:

1. **React and Vite** for frontend development;
2. **FastAPI** for backend development and API routing;
3. **SQLite** for data storage;
4. **JWT** for authentication and authorization;
5. **Web-based UI components** for interactive user experience.

### 4.5 User Interface Description

The interface of AgroMet is designed to be simple, responsive, and easy to navigate. The major interface components include:

1. home and landing pages for accessing core services;
2. weather pages for displaying weather-related information;
3. advisory pages for crop and poultry content;
4. an admin dashboard for managing uploaded and stored data;
5. a chatbot widget for interactive question answering.

The system emphasizes clear navigation and readability so that users can interact with the platform without unnecessary complexity.

### 4.6 Expected System Outputs

The main outputs of the system include:

1. weather-informed agricultural information;
2. structured crop and poultry advisory content;
3. secure management of agricultural records;
4. conversational responses to user queries;
5. a functional software prototype for demonstration and evaluation.

### 4.7 Testing and Results

The developed prototype will be tested to confirm that major system components function correctly. The tests will focus on:

1. successful user authentication;
2. access to weather and advisory pages;
3. correct storage and retrieval of records;
4. chatbot response generation;
5. general system responsiveness and usability.

The expected result is that the system will operate as an integrated platform capable of providing users with weather-informed agricultural support through both structured interfaces and conversational interaction.

### 4.8 Discussion of Results

The expected findings of this study are that integrating weather information, advisory content, data management, and AI interaction into one platform can improve accessibility and simplify user engagement with agricultural information. The system is also expected to demonstrate that a full-stack intelligent web application can be successfully designed for a real-world agricultural context using practical and affordable technologies.

### 4.9 Summary

This chapter has described the system architecture, modules, implementation technologies, interface design, and expected results of the AgroMet platform. The next chapter presents the conclusion and recommendations of the study.

---

# CHAPTER FIVE

## SUMMARY, CONCLUSION AND RECOMMENDATIONS

### 5.1 Summary

This study focuses on the design and implementation of an AI-powered agro-meteorological decision support system for climate-smart farming in Ghana. The project is motivated by the challenge of fragmented access to weather information, agricultural advisory services, and practical digital support for farm-related decisions. The proposed system, AgroMet, integrates weather information, advisory management, agricultural record handling, and a conversational AI assistant into a single web-based platform.

The study applies core Computer Science concepts including software engineering, system design, database management, application programming interfaces, authentication, and artificial intelligence. Through the development of a functional prototype, the work demonstrates how intelligent web systems can be used to improve access to domain-specific knowledge and support decision-making in agriculture.

### 5.2 Conclusion

The study concludes that a web-based agro-meteorological decision support system can provide a practical means of improving access to weather-informed agricultural guidance. By combining structured digital services with conversational AI support, the proposed AgroMet platform offers a more unified and accessible approach to agricultural information delivery.

From a Computer Science perspective, the project shows that intelligent information systems can be designed to address real-world problems through the integration of frontend interfaces, backend services, secure authentication, database support, and AI-based interaction. The expected outcome is not only a usable prototype but also an academic contribution to applied computing in agriculture.

### 5.3 Recommendations

Based on the proposed study, the following recommendations are made:

1. future versions of the system should include stronger localization features for Ghanaian languages and regional contexts;
2. the platform can be extended with richer live data integration and analytics features;
3. future work may include field-based user evaluation involving farmers and agricultural extension officers;
4. the chatbot component may be improved with more specialized agricultural knowledge and personalization;
5. the system may be expanded into a mobile-first or offline-friendly version for wider accessibility.

### 5.4 Suggestions for Further Research

Further research may explore:

1. recommender systems for personalized crop and farm planning;
2. explainable AI techniques for agricultural advisory systems;
3. multilingual conversational interfaces for low-resource communities;
4. mobile and offline-first agricultural decision support systems;
5. long-term adoption studies for digital agricultural platforms in Ghana.

### 5.5 Final Remark

The proposed AgroMet system presents a meaningful intersection between Computer Science and agriculture. It demonstrates how modern software technologies can be applied to build intelligent systems that respond to practical national development challenges. With further refinement and validation, such systems can contribute significantly to digital agriculture and climate-smart decision-making in Ghana.

---

# REFERENCES

Abate, G. T., Abay, K. A., Chamberlin, J., Kassim, Y., Spielman, D. J., & Tabe-Ojong, M. P., Jr. (2023). Digital tools and agricultural market transformation in Africa: Why are they not at scale yet, and what will it take to get there? *Food Policy, 116*, 102439. https://doi.org/10.1016/j.foodpol.2023.102439

    Abdulai, A.-R., Tetteh Quarshie, P., Duncan, E., & Fraser, E. (2023). Is agricultural digitization a reality among smallholder farmers in Africa? Unpacking farmers' lived realities of engagement with digital tools and services in rural Northern Ghana. *Agriculture & Food Security, 12*, Article 11. https://doi.org/10.1186/s40066-023-00416-6

    Damos, P. (2015). Modular structure of web-based decision support systems for integrated pest management: A review. *Agronomy for Sustainable Development, 35*, 1347-1372. https://doi.org/10.1007/s13593-015-0319-9

    Dobardzic, S., Dengel, C. G., Gomes, A. M., Hansen, J., Bernardi, M., Fujisawa, M., Heureux, A. M., Kanamaru, H., Neretin, L., Rojas, O., Intsiful, J., Barnwal, A., Iqbal, F., Kull, D., Bogdanova, A. M., Fara, K., Pergolini, G., Aich, V., Alexieva, A., ... Wright, W. (2019). *2019 state of climate services: Agriculture and food security*. World Meteorological Organization. https://public.wmo.int/publication-series/2019-state-of-climate-services-agriculture-and-food-security

    Gutierrez, F., Htun, N. N., Schlenz, F., Kasimati, A., & Verbert, K. (2019). A review of visualisations in agricultural decision support systems: An HCI perspective. *Computers and Electronics in Agriculture, 163*, 104844. https://doi.org/10.1016/j.compag.2019.05.053

    Kuhail, M. A., Alturki, N., Alramlawi, S., & Alhejori, K. (2023). Interacting with educational chatbots: A systematic review. *Education and Information Technologies, 28*, 973-1018. https://doi.org/10.1007/s10639-022-11177-3

    Linaza, M. T., Posada, J., Bund, J., Eisert, P., Quartulli, M., Dollner, J., Pagani, A., Olaizola, I. G., Barriguinha, A., Moysiadis, T., & Lucat, L. (2021). Data-driven artificial intelligence applications for sustainable precision agriculture. *Agronomy, 11*(6), 1227. https://doi.org/10.3390/agronomy11061227

    Rupnik, R., Kukar, M., Vracar, P., Kosir, D., Pevec, D., & Bosnic, Z. (2019). AgroDSS: A decision support system for agriculture and farming. *Computers and Electronics in Agriculture, 161*, 260-271. https://doi.org/10.1016/j.compag.2018.04.001

    Sachithra, V., & Subhashini, L. D. C. S. (2023). How artificial intelligence uses to achieve the agriculture sustainability: Systematic review. *Artificial Intelligence in Agriculture, 8*, 46-59. https://doi.org/10.1016/j.aiia.2023.04.002

    Zhai, Z., Martinez, J. F., Beltran, V., & Martinez, N. L. (2020). Decision support systems for agriculture 4.0: Survey and challenges. *Computers and Electronics in Agriculture, 170*, 105256. https://doi.org/10.1016/j.compag.2020.105256

---

# APPENDIX A: FORMATTING NOTES FOR SUBMISSION

Before submission, convert this draft into your department's required final layout in Word using:

1. Times New Roman, size 12 for body text unless your supervisor specifies otherwise;
2. 1.5 or double line spacing according to department preference;
3. centered preliminary pages and chapter headings;
4. APA in-text citations and hanging-indent reference list formatting; and
5. page numbering and table of contents generated in Word.

If your department gives you a local template, keep the chapter structure in this draft and simply transfer the content into that template.

Suggested preliminary page order in Word:

1. Title page
2. Declaration
3. Acknowledgements
4. Abstract
5. Table of contents
6. Main chapters
7. References
8. Appendices
