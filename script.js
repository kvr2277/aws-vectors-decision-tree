// AWS Vector Databases Decision Tree and Interactive Features

class VectorDatabaseDecisionTree {
    constructor() {
        this.currentNode = 'start-node';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupNavigation();
        this.setupIntersectionObserver();
    }

    setupEventListeners() {
        // Decision tree navigation
        const optionButtons = document.querySelectorAll('.option-btn');

        optionButtons.forEach((btn, index) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const nextNode = e.currentTarget.dataset.next;
                const result = e.currentTarget.dataset.result;

                if (nextNode) {
                    this.navigateToNode(nextNode);
                } else if (result) {
                    this.showResult(result);
                }
            });
        });

        // Back button functionality
        const backButtons = document.querySelectorAll('.back-btn');

        backButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const backTo = e.currentTarget.dataset.back;
                this.navigateToNode(backTo);
            });
        });

        // Mobile navigation toggle
        const navToggle = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('.nav-menu');

        if (navToggle) {
            navToggle.addEventListener('click', () => {
                navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex';
            });
        }

        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Service card interactions
        document.querySelectorAll('.service-card').forEach(card => {
            card.addEventListener('click', () => {
                this.showServiceDetails(card.dataset.service);
            });
        });

        // Pillar interactions
        document.querySelectorAll('.pillar').forEach(pillar => {
            pillar.addEventListener('click', () => {
                this.highlightPillar(pillar.dataset.pillar);
            });
        });

        // Title click to go to start of decision tree
        const navTitle = document.getElementById('nav-title');
        if (navTitle) {
            navTitle.addEventListener('click', () => {
                this.navigateToNode('start-node');
                // Scroll to decision tree section
                const decisionTreeSection = document.getElementById('decision-tree');
                if (decisionTreeSection) {
                    decisionTreeSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }
    }

    setupNavigation() {
        // Update active navigation item based on scroll position
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-menu a');

        window.addEventListener('scroll', () => {
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;
                if (scrollY >= (sectionTop - 200)) {
                    current = section.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('active');
                }
            });
        });
    }

    setupIntersectionObserver() {
        // Animate elements when they come into view
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe cards and sections for animation
        document.querySelectorAll('.service-card, .use-case-card, .resource-card, .pillar').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }

    navigateToNode(nodeId) {
        // Hide current node
        const currentNodes = document.querySelectorAll('.decision-node');

        currentNodes.forEach(node => {
            node.classList.remove('active');
        });

        // Show target node
        const targetNode = document.getElementById(nodeId);

        if (targetNode) {
            targetNode.classList.add('active');
            this.currentNode = nodeId;
        }

        // Hide results if navigating back to nodes
        const resultsSection = document.getElementById('results');
        if (resultsSection) {
            resultsSection.classList.remove('active');
        }
    }

    showResult(resultType) {
        const resultsSection = document.getElementById('results');
        if (!resultsSection) return;

        const resultData = this.getResultData(resultType);

        resultsSection.innerHTML = `
            <div class="result-content">
                <h3 class="result-title">${resultData.title}</h3>
                <p class="result-description">${resultData.description}</p>
                
                <div class="result-services">
                    ${resultData.services.map(service => `
                        <div class="result-service">
                            <h4>${service.name}</h4>
                            <p>${service.description}</p>
                            <div class="service-benefits">
                                <strong>Key Benefits:</strong>
                                <ul>
                                    ${service.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
                                </ul>
                            </div>
                            <div class="service-cost">
                                <strong>Cost Considerations:</strong>
                                <p>${service.cost}</p>
                            </div>
                            <div class="service-best-for">
                                <strong>Best For:</strong>
                                <p>${service.bestFor}</p>
                            </div>
                            ${service.link ? `<a href="${service.link}" target="_blank" class="service-link">Get Started →</a>` : ''}
                        </div>
                    `).join('')}
                </div>
                
                <div class="result-actions">
                    <button class="btn btn-primary" onclick="decisionTree.startOver()">Start Over</button>
                    <a href="#use-cases" class="btn btn-secondary">View Use Cases</a>
                </div>
            </div>
        `;

        resultsSection.classList.add('active');
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    startOver() {
        // Reset to start node
        this.navigateToNode('start-node');
        // Scroll to decision tree section
        const decisionTreeSection = document.getElementById('decision-tree');
        if (decisionTreeSection) {
            decisionTreeSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    getResultData(resultType) {
        const results = {
            'opensearch-basic': {
                title: 'Amazon OpenSearch Service - Basic Setup',
                description: 'Perfect for small to medium-scale semantic search with straightforward setup and managed infrastructure.',
                services: [
                    {
                        name: 'Amazon OpenSearch Service',
                        description: 'Fully managed search and analytics service with built-in vector search capabilities.',
                        benefits: [
                            'k-NN vector search with multiple algorithms',
                            'Hybrid search combining text and vectors',
                            'Real-time indexing and search',
                            'Built-in security and encryption',
                            'Auto-scaling and multi-AZ support'
                        ],
                        cost: '$200-$2,000/month for typical workloads (3-node cluster with moderate usage)',
                        bestFor: 'Organizations with < 1M documents, moderate query volume, need for hybrid search',
                        link: 'https://docs.aws.amazon.com/opensearch-service/latest/developerguide/semantic-search.html'
                    }
                ]
            },
            'opensearch-enterprise': {
                title: 'Amazon OpenSearch Service - Enterprise Scale',
                description: 'Enterprise-grade solution for high-volume semantic search with advanced features and optimization.',
                services: [
                    {
                        name: 'Amazon OpenSearch Service (Enterprise)',
                        description: 'Large-scale deployment with advanced configurations for enterprise workloads.',
                        benefits: [
                            'Multi-tenant architecture support',
                            'Advanced security with SAML/LDAP',
                            'Cross-cluster replication',
                            'Custom dictionaries and analyzers',
                            'Performance optimization tools'
                        ],
                        cost: '$2,000-$20,000/month depending on scale and features',
                        bestFor: 'Large enterprises, > 1M documents, high query volume, complex security requirements',
                        link: 'https://aws.amazon.com/opensearch-service/features/'
                    }
                ]
            },
            'bedrock-knowledge-base': {
                title: 'Amazon Bedrock Knowledge Bases',
                description: 'Rapid prototyping and development with fully managed RAG capabilities and automatic embeddings.',
                services: [
                    {
                        name: 'Amazon Bedrock Knowledge Bases',
                        description: 'Serverless RAG service with built-in vector storage and retrieval.',
                        benefits: [
                            'Automatic embedding generation',
                            'Managed vector storage (OpenSearch Serverless)',
                            'Built-in document chunking strategies',
                            'Native integration with foundation models',
                            'No infrastructure management'
                        ],
                        cost: '$100-$1,000/month plus embedding and LLM costs',
                        bestFor: 'Rapid prototyping, small to medium datasets, teams wanting managed services',
                        link: 'https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base.html'
                    }
                ]
            },
            'bedrock-enterprise-rag': {
                title: 'Amazon Bedrock - Enterprise RAG Solution',
                description: 'High-security, compliant RAG solution for enterprise knowledge management.',
                services: [
                    {
                        name: 'Amazon Bedrock (Enterprise Setup)',
                        description: 'Enterprise-grade RAG with comprehensive security and compliance features.',
                        benefits: [
                            'VPC endpoint support for private access',
                            'Comprehensive audit logging',
                            'Data residency controls',
                            'Fine-grained access controls',
                            'Integration with AWS security services'
                        ],
                        cost: '$1,000-$10,000/month depending on usage and model selection',
                        bestFor: 'Regulated industries, sensitive data, enterprise compliance requirements',
                        link: 'https://aws.amazon.com/bedrock/security-compliance/'
                    }
                ]
            },
            'opensearch-rag': {
                title: 'Custom RAG with OpenSearch',
                description: 'Flexible RAG implementation with full control over embeddings, models, and processing.',
                services: [
                    {
                        name: 'Amazon OpenSearch + Custom RAG Pipeline',
                        description: 'Build custom RAG solutions with OpenSearch as the vector store.',
                        benefits: [
                            'Full control over embedding models',
                            'Custom retrieval strategies',
                            'Integration with any LLM service',
                            'Advanced query processing',
                            'Cost optimization flexibility'
                        ],
                        cost: '$500-$5,000/month for infrastructure plus development costs',
                        bestFor: 'Custom requirements, specific model needs, existing OpenSearch expertise',
                        link: 'https://github.com/aws-samples/amazon-opensearch-service-samples'
                    }
                ]
            },
            'personalization-service': {
                title: 'Amazon Personalize',
                description: 'ML-powered recommendation system for e-commerce and retail applications.',
                services: [
                    {
                        name: 'Amazon Personalize',
                        description: 'Fully managed machine learning service for creating recommendation systems.',
                        benefits: [
                            'AutoML for recommendation algorithms',
                            'Real-time and batch recommendations',
                            'A/B testing capabilities',
                            'Multiple recommendation types',
                            'Business metrics optimization'
                        ],
                        cost: '$200-$2,000/month based on requests and data size',
                        bestFor: 'E-commerce, retail, content platforms with user interaction data',
                        link: 'https://aws.amazon.com/personalize/getting-started/'
                    }
                ]
            },
            'content-recommendations': {
                title: 'Content Recommendation with Vector Search',
                description: 'Vector-based content recommendations for media and entertainment platforms.',
                services: [
                    {
                        name: 'OpenSearch + Custom Content Engine',
                        description: 'Content similarity matching using vector embeddings and semantic search.',
                        benefits: [
                            'Content-based filtering',
                            'Semantic content matching',
                            'Multi-modal content support',
                            'Real-time recommendations',
                            'Integration with content catalogs'
                        ],
                        cost: '$300-$3,000/month depending on content volume',
                        bestFor: 'Media platforms, content sites, article recommendations, video platforms',
                        link: 'https://aws.amazon.com/blogs/machine-learning/'
                    }
                ]
            },
            'custom-recommendations': {
                title: 'Custom Vector-Based Recommendations',
                description: 'Domain-specific similarity matching with custom embeddings and algorithms.',
                services: [
                    {
                        name: 'Custom Vector Recommendation System',
                        description: 'Build specialized recommendation systems using vector similarity.',
                        benefits: [
                            'Domain-specific embeddings',
                            'Custom similarity metrics',
                            'Multi-criteria recommendations',
                            'Advanced filtering capabilities',
                            'Integration with business logic'
                        ],
                        cost: '$500-$5,000/month including development and infrastructure',
                        bestFor: 'Specialized domains, B2B applications, complex matching requirements',
                        link: 'https://aws.amazon.com/architecture/machine-learning/'
                    }
                ]
            },
            'image-similarity': {
                title: 'Image & Visual Similarity Search',
                description: 'Vector-based image similarity matching for visual search and product discovery.',
                services: [
                    {
                        name: 'Amazon OpenSearch + Image Embeddings',
                        description: 'Custom image similarity search using pre-trained vision models.',
                        benefits: [
                            'Pre-trained vision models (ResNet, EfficientNet)',
                            'Custom feature extraction pipelines',
                            'Real-time similarity scoring',
                            'Integration with S3 for image storage',
                            'Scalable indexing and search'
                        ],
                        cost: '$300-$3,000/month depending on image volume and processing needs',
                        bestFor: 'E-commerce, fashion, real estate, visual content platforms',
                        link: 'https://aws.amazon.com/rekognition/'
                    }
                ]
            },
            'text-similarity': {
                title: 'Text & Document Similarity',
                description: 'Advanced text similarity matching for content deduplication and analysis.',
                services: [
                    {
                        name: 'Amazon OpenSearch + Text Embeddings',
                        description: 'Semantic text similarity using transformer-based embeddings.',
                        benefits: [
                            'Transformer-based embeddings (BERT, Sentence-BERT)',
                            'Language-specific models',
                            'Plagiarism and duplicate detection',
                            'Cross-lingual similarity matching',
                            'Real-time content analysis'
                        ],
                        cost: '$400-$2,500/month for typical document volumes',
                        bestFor: 'Content platforms, academic institutions, publishing, legal firms',
                        link: 'https://docs.aws.amazon.com/opensearch-service/latest/developerguide/semantic-search.html'
                    }
                ]
            },
            'behavior-similarity': {
                title: 'User Behavior Similarity & Anomaly Detection',
                description: 'Detect similar user patterns and anomalies for fraud prevention and personalization.',
                services: [
                    {
                        name: 'Amazon OpenSearch + Behavioral Analytics',
                        description: 'User behavior pattern analysis using vector similarity.',
                        benefits: [
                            'Real-time fraud detection',
                            'User segmentation and clustering',
                            'Anomaly detection algorithms',
                            'Behavioral pattern recognition',
                            'Integration with security systems'
                        ],
                        cost: '$500-$4,000/month based on user volume and analysis complexity',
                        bestFor: 'Fintech, e-commerce, security applications, user analytics platforms',
                        link: 'https://aws.amazon.com/fraud-detector/'
                    }
                ]
            },
            'image-search': {
                title: 'Image Search & Visual Discovery',
                description: 'Comprehensive image search solution for visual content discovery.',
                services: [
                    {
                        name: 'Amazon Rekognition + OpenSearch',
                        description: 'Fully managed image analysis with custom vector search.',
                        benefits: [
                            'Automatic feature extraction',
                            'Object and scene detection',
                            'Celebrity and text recognition',
                            'Custom label detection',
                            'Reverse image search capabilities'
                        ],
                        cost: '$200-$2,000/month plus API costs for image processing',
                        bestFor: 'Media companies, e-commerce, social platforms, digital asset management',
                        link: 'https://aws.amazon.com/rekognition/'
                    }
                ]
            },
            'video-search': {
                title: 'Video & Audio Content Search',
                description: 'Advanced multimedia search for video and audio content libraries.',
                services: [
                    {
                        name: 'Amazon Transcribe + Rekognition Video + OpenSearch',
                        description: 'Multimodal video search combining visual, audio, and text analysis.',
                        benefits: [
                            'Automatic speech recognition',
                            'Video scene detection',
                            'Content moderation',
                            'Thumbnail generation',
                            'Temporal search capabilities'
                        ],
                        cost: '$800-$5,000/month depending on video volume and processing requirements',
                        bestFor: 'Media & entertainment, education, surveillance, content creators',
                        link: 'https://aws.amazon.com/media-services/'
                    }
                ]
            },
            'multimodal-search': {
                title: 'Multimodal Search (Text + Images + Metadata)',
                description: 'Advanced search combining multiple content types and modalities.',
                services: [
                    {
                        name: 'Amazon Bedrock + OpenSearch Multimodal',
                        description: 'Next-generation multimodal search using foundation models.',
                        benefits: [
                            'Multimodal embeddings (text + image)',
                            'Cross-modal search capabilities',
                            'Foundation model integration',
                            'Unified search interface',
                            'Advanced relevance scoring'
                        ],
                        cost: '$1,000-$8,000/month including foundation model costs',
                        bestFor: 'Research institutions, media companies, advanced AI applications',
                        link: 'https://aws.amazon.com/bedrock/'
                    }
                ]
            },
            'code-semantic-search': {
                title: 'Semantic Code Search',
                description: 'AI-powered code search that understands functionality, not just syntax.',
                services: [
                    {
                        name: 'Amazon CodeWhisperer + OpenSearch',
                        description: 'Intelligent code search using ML-powered code understanding.',
                        benefits: [
                            'Function-level code embeddings',
                            'Cross-language code search',
                            'API and library discovery',
                            'Code pattern recognition',
                            'Integration with IDEs'
                        ],
                        cost: '$300-$1,500/month for development teams',
                        bestFor: 'Software development teams, open source projects, code repositories',
                        link: 'https://aws.amazon.com/codewhisperer/'
                    }
                ]
            },
            'documentation-search': {
                title: 'Technical Documentation Search',
                description: 'Advanced search for technical documentation and API references.',
                services: [
                    {
                        name: 'Amazon Bedrock Knowledge Bases for Technical Docs',
                        description: 'Specialized documentation search with technical context understanding.',
                        benefits: [
                            'Technical terminology understanding',
                            'API documentation indexing',
                            'Code example extraction',
                            'Version-aware search',
                            'Developer-friendly interfaces'
                        ],
                        cost: '$200-$1,200/month for technical documentation',
                        bestFor: 'Software companies, API providers, technical documentation sites',
                        link: 'https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base.html'
                    }
                ]
            },
            'code-similarity': {
                title: 'Code Similarity & Duplication Detection',
                description: 'Detect similar code patterns and identify potential duplications.',
                services: [
                    {
                        name: 'Amazon CodeGuru + OpenSearch',
                        description: 'Code analysis and similarity detection for quality and security.',
                        benefits: [
                            'Duplicate code detection',
                            'Similar pattern identification',
                            'Security vulnerability detection',
                            'Code quality metrics',
                            'Automated code review insights'
                        ],
                        cost: '$100-$800/month for code analysis',
                        bestFor: 'Enterprise development teams, code quality assurance, security teams',
                        link: 'https://aws.amazon.com/codeguru/'
                    }
                ]
            },
            'website-chatbot': {
                title: 'Website Chatbot with RAG',
                description: 'Basic customer-facing chatbot for FAQ automation and simple queries.',
                services: [
                    {
                        name: 'Amazon Bedrock + Lex',
                        description: 'Managed chatbot solution with RAG capabilities.',
                        benefits: [
                            'Pre-built conversation flows',
                            'Natural language understanding',
                            'Multi-channel deployment',
                            'Analytics and monitoring',
                            'Easy integration with websites'
                        ],
                        cost: '$100-$800/month for small to medium websites',
                        bestFor: 'Small to medium businesses, FAQ automation, basic customer support',
                        link: 'https://aws.amazon.com/lex/'
                    }
                ]
            },
            'customer-support-rag': {
                title: 'Advanced Customer Support RAG',
                description: 'Enterprise-grade customer support with complex query handling and escalation.',
                services: [
                    {
                        name: 'Amazon Connect + Bedrock RAG',
                        description: 'Full-featured contact center with AI-powered knowledge retrieval.',
                        benefits: [
                            'Omnichannel support (voice, chat, email)',
                            'Intelligent routing and escalation',
                            'Real-time agent assistance',
                            'Customer sentiment analysis',
                            'Performance analytics and insights'
                        ],
                        cost: '$1,500-$8,000/month for enterprise support operations',
                        bestFor: 'Large enterprises, complex customer support, multi-channel operations',
                        link: 'https://aws.amazon.com/connect/'
                    }
                ]
            },
            'public-knowledge-rag': {
                title: 'Public Knowledge Assistant',
                description: 'Large-scale public-facing knowledge systems for information access.',
                services: [
                    {
                        name: 'Amazon Bedrock + OpenSearch Enterprise',
                        description: 'Scalable public knowledge system with high availability.',
                        benefits: [
                            'High-availability architecture',
                            'Global content delivery',
                            'Multi-language support',
                            'Load balancing and auto-scaling',
                            'Public API access'
                        ],
                        cost: '$3,000-$15,000/month for large-scale public systems',
                        bestFor: 'Government agencies, educational institutions, public information systems',
                        link: 'https://aws.amazon.com/bedrock/'
                    }
                ]
            },
            'legal-rag': {
                title: 'Legal Research & Compliance RAG',
                description: 'Specialized RAG system for legal research, contract analysis, and compliance.',
                services: [
                    {
                        name: 'Amazon Bedrock + Textract for Legal',
                        description: 'Legal document analysis with compliance-grade security.',
                        benefits: [
                            'Legal document understanding',
                            'Contract clause extraction',
                            'Regulatory compliance checking',
                            'Citation and precedent tracking',
                            'Audit trails and data governance'
                        ],
                        cost: '$2,000-$12,000/month for legal practices',
                        bestFor: 'Law firms, legal departments, compliance teams, regulatory bodies',
                        link: 'https://aws.amazon.com/textract/'
                    }
                ]
            },
            'medical-rag': {
                title: 'Healthcare & Medical RAG',
                description: 'HIPAA-compliant RAG for medical literature, diagnosis support, and research.',
                services: [
                    {
                        name: 'Amazon Bedrock + HealthLake',
                        description: 'HIPAA-compliant medical knowledge system with specialized health AI.',
                        benefits: [
                            'HIPAA-compliant infrastructure',
                            'Medical terminology understanding',
                            'Clinical decision support',
                            'Research paper analysis',
                            'Integration with health records'
                        ],
                        cost: '$3,000-$15,000/month for healthcare applications',
                        bestFor: 'Healthcare providers, medical research, pharmaceutical companies',
                        link: 'https://aws.amazon.com/healthlake/'
                    }
                ]
            },
            'technical-rag': {
                title: 'Technical & Engineering RAG',
                description: 'Specialized RAG for technical manuals, engineering documentation, and research papers.',
                services: [
                    {
                        name: 'Amazon Bedrock + Technical Knowledge Base',
                        description: 'Technical documentation system with engineering-specific understanding.',
                        benefits: [
                            'Technical specification parsing',
                            'Engineering drawing analysis',
                            'Standards and compliance checking',
                            'Equipment manual search',
                            'Research paper indexing'
                        ],
                        cost: '$1,000-$6,000/month for technical organizations',
                        bestFor: 'Engineering firms, manufacturing, research institutions, technical support',
                        link: 'https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base.html'
                    }
                ]
            }
        };

        return results[resultType] || {
            title: 'Recommendation Not Found',
            description: 'Please try the decision tree again or contact support.',
            services: []
        };
    }

    showServiceDetails(serviceType) {
        const serviceDetails = {
            'opensearch': {
                title: 'Amazon OpenSearch Service Deep Dive',
                description: 'Comprehensive vector database capabilities for semantic search and analytics.',
                features: [
                    'k-NN vector search with FAISS, Hierarchical Navigable Small World (HNSW)',
                    'Hybrid queries combining text search with vector similarity',
                    'Multiple distance metrics (L2, cosine, L1)',
                    'Index warming and performance optimization',
                    'Integration with machine learning pipelines'
                ],
                pricing: 'Starting at $0.088/hour for t3.small.search instances',
                useCases: [
                    'Enterprise document search',
                    'E-commerce product discovery',
                    'Content recommendation systems',
                    'Fraud detection and anomaly analysis'
                ]
            },
            'bedrock': {
                title: 'Amazon Bedrock Knowledge Bases',
                description: 'Fully managed RAG service with automatic embeddings and vector storage.',
                features: [
                    'Automatic text embedding with Titan or Cohere models',
                    'Managed OpenSearch Serverless backend',
                    'Built-in chunking strategies for documents',
                    'Native integration with foundation models',
                    'No infrastructure management required'
                ],
                pricing: 'Pay-per-use: $0.0001 per 1K input tokens for embeddings',
                useCases: [
                    'Customer support chatbots',
                    'Internal knowledge assistants',
                    'Document Q&A systems',
                    'Technical documentation search'
                ]
            }
            // Add more service details as needed
        };

        const details = serviceDetails[serviceType];
        if (details) {
            this.showToast(`${details.title}: ${details.description}`);
        }
    }

    highlightPillar(pillarType) {
        const pillars = document.querySelectorAll('.pillar');
        pillars.forEach(pillar => {
            if (pillar.dataset.pillar === pillarType) {
                pillar.style.borderColor = 'var(--matrix-accent)';
                pillar.style.transform = 'translateY(-8px) scale(1.02)';
            } else {
                pillar.style.borderColor = 'var(--matrix-border)';
                pillar.style.transform = 'translateY(0) scale(1)';
            }
        });

        // Reset after 3 seconds
        setTimeout(() => {
            pillars.forEach(pillar => {
                pillar.style.borderColor = 'var(--matrix-border)';
                pillar.style.transform = 'translateY(0) scale(1)';
            });
        }, 3000);
    }

    scrollTo(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('Copied to clipboard!');
        });
    }

    showToast(message, duration = 3000) {
        // Create toast element
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--matrix-card-bg);
            color: var(--matrix-text-bright);
            padding: 12px 20px;
            border-radius: 8px;
            border: 1px solid var(--matrix-border);
            backdrop-filter: blur(10px);
            z-index: 10000;
            animation: slideInUp 0.3s ease-out;
        `;
        toast.textContent = message;

        document.body.appendChild(toast);

        // Remove toast after duration
        setTimeout(() => {
            toast.style.animation = 'slideOutDown 0.3s ease-out';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, duration);
    }

    // Utility methods
    formatNumber(num) {
        return new Intl.NumberFormat('en-US').format(num);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize the decision tree when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.decisionTree = new VectorDatabaseDecisionTree();
});

// Add some CSS for toast animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInUp {
        from {
            transform: translateY(100%);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutDown {
        from {
            transform: translateY(0);
            opacity: 1;
        }
        to {
            transform: translateY(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style); 