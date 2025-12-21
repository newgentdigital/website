export const nav = {
  mainNavigation: "Main Navigation",
  returnToNewgent: "Return to Newgent",
  mobileMenu: "Menu",
  links: {
    aboutUs: "About us",
    work: "Work",
    contact: "Contact",
    connections: "Connections",
    dataAndDashboards: "Data & dashboards",
    securityStack: "Security stack",
    setup: "Setup",
    about: "About",
    getStarted: "Get started",
    dashboards: "Dashboards",
    dataPipelines: "Data pipelines",
    paymentProviders: "Payment providers",
    accounting: "Accounting & tax",
    crowdfunding: "Crowdfunding platforms",
    rewardChannels: "Reward channels",
    scanEngines: "Scan engines",
    alerting: "Alerting & monitoring",
  },
  megaMenu: {
    newgent: {
      designServices: {
        label: "Design Services",
        items: {
          brandIdentity: {
            label: "Brand Identity",
            description:
              "Cohesive brand identities that resonate with your audience.",
          },
          graphicDesign: {
            description:
              "Marketing materials, illustrations, and creative assets.",
          },
          uiUxDesign: {
            label: "UI/UX Design",
            description:
              "User interface and user experience design for web and mobile.",
          },
        },
      },
      mediaProduction: {
        label: "Media Production",
        items: {
          videoProduction: {
            description:
              "Engaging video content for marketing, training, and storytelling.",
          },
          photography: {
            description:
              "Professional photography services for events, products, and branding.",
          },
        },
      },
      content: {
        label: "Content & Marketing",
        items: {
          contentWriting: {
            label: "Content Writing",
            description:
              "Clear, conversion-focused copy for pages, emails, and product launches.",
          },
          emailMarketing: {
            label: "Email Marketing",
            description: "Plan, write, and send campaigns that convert.",
          },
        },
      },
      web: {
        label: "Web Services",
        items: {
          seoStrategy: {
            label: "SEO Strategy",
            description:
              "Technical and on-page SEO with research-backed content plans.",
          },
          webDevelopment: {
            label: "Web Development",
            description:
              "High-performance marketing sites and landing pages built to convert.",
          },
        },
      },
      featuredItem: {
        title: "See what we've created",
        description:
          "Explore case studies and real projects from Nordic brands who trust Newgent with their creative vision and communications.",
        ctaLabel: "View case studies",
      },
    },
    discern: {
      integrations: {
        metabaseDescription:
          "Visualize Discord analytics in beautiful, interactive dashboards.",
        grafanaDescription:
          "Monitor community metrics in real-time with custom alerts.",
      },
      destinations: {
        clickhouseDescription:
          "Store community data efficiently for lightning-fast analytics.",
        influxdbDescription:
          "Track time-series metrics with high-performance storage.",
        postgresqlDescription:
          "Store and query Discord analytics data in a relational database.",
      },
      automation: {
        webhooksDescription:
          "Send events to your tools for custom workflows and alerts.",
        zapierDescription:
          "Automate Discord insights into CRMs, sheets, and more—no code.",
        n8nDescription:
          "Orchestrate advanced workflows and data syncs with full control.",
      },
      featuredItem: {
        title: "How communities grow with data",
        description:
          "See how Discord servers turned analytics into action. Real stories from marketers and community managers that scaled smarter.",
        ctaLabel: "Read success stories",
      },
    },
    finconnect: {
      integrations: {
        stripeDescription:
          "Automate payment reconciliation and subscription tracking.",
        wiseDescription:
          "Sync international transactions automatically to your books.",
        revolutDescription:
          "Connect business accounts for seamless expense tracking.",
      },
      destinations: {
        fortnoxDescription:
          "Automate Swedish accounting with direct transaction sync.",
        skatteverketDescription:
          "Generate tax reports automatically from connected providers.",
        webhooksDescription: "Push financial data to any system in real-time.",
      },
      featuredItem: {
        title: "From hours to minutes: Customer stories",
        description:
          "Businesses and accountants share how Finconnect eliminated manual bookkeeping by adopting automation. See the time saved, and mistakes avoided.",
        ctaLabel: "Read their stories",
      },
    },
    patronius: {
      integrations: {
        openCollectiveDescription:
          "Reward backers instantly with automated Discord perks.",
        liberaPayDescription:
          "Grant supporter roles automatically when donations arrive.",
        githubSponsorsDescription:
          "Give sponsors exclusive access to your Discord community.",
        thanksDevDescription:
          "Recognize open-source contributors with automated Discord rewards.",
      },
      destinations: {
        discordDescription:
          "Assign roles and perks automatically through self-service verification.",
        grafanaDescription:
          "Track donor engagement and reward distribution analytics.",
        webhooksDescription:
          "Trigger perk updates and CRM actions automatically.",
      },
      featuredItem: {
        title: "Creators who rewarded smarter",
        description:
          "Learn from open source projects and content creators who automated supporter rewards. Read guides, see real results, and reward your supporters.",
        ctaLabel: "See setup guides",
      },
    },
    shellguard: {
      integrations: {
        clamavDescription:
          "Scan attachments automatically with trusted open-source protection.",
        virusTotalDescription:
          "Check files against 70+ antivirus engines instantly.",
        hybridAnalysisDescription:
          "Analyze suspicious files with advanced behavioral detection.",
        triageDescription:
          "Deep-dive malware analysis for comprehensive threat intelligence.",
        malwareBazaarDescription:
          "Cross-reference files against known malware signatures.",
      },
      destinations: {
        discordDescription:
          "Alert moderators instantly when threats are detected.",
        grafanaDescription:
          "Monitor security metrics and scan results in real-time.",
        prometheusDescription:
          "Track security metrics and threat detection rates over time.",
        webhooksDescription:
          "Integrate scan results into your existing security workflows.",
      },
      featuredItem: {
        title: "Communities protected from threats",
        description:
          "Real incidents caught by Shellguard. Learn from server admins and community moderators who stopped attacks before they spread.",
        ctaLabel: "View security cases",
      },
    },
  },
  actionbar: {
    label: "Actions bar",
    serviceStatus: "Service status",
    login: "Sign in",
    platforms: {
      label: "Platforms",
      items: {
        newgent: {
          label: "Newgent Digital",
          description: "All-in-one Nordic media agency",
        },
        finconnect: {
          label: "Finconnect",
          description: "Sweden's most open financial integration",
          subItems: {
            manageFinconnect: {
              label: "Manage Finconnect",
              description: "Manage your Finconnect settings and integrations.",
            },
            finconnectGithub: {
              label: "Finconnect on GitHub",
              description:
                "Explore Finconnect's source code and contribute to the project.",
            },
          },
        },
        discern: {
          label: "Discern",
          description: "Turn Discord into a marketing powerhouse",
          subItems: {
            manageDiscern: {
              label: "Manage Discern",
              description:
                "Manage your Discern settings and connected servers.",
            },
            discernGithub: {
              label: "Discern on GitHub",
              description:
                "Explore Discern's source code and contribute to the project.",
            },
          },
        },
        shellguard: {
          label: "Shellguard",
          description: "Scan Discord for malicious content and viruses",
          subItems: {
            manageShellguard: {
              label: "Manage Shellguard",
              description:
                "Manage your Shellguard settings and scanned servers.",
            },
            shellguardGithub: {
              label: "Shellguard on GitHub",
              description:
                "Explore Shellguard's source code and contribute to the project.",
            },
          },
        },
        patronius: {
          label: "Patronius",
          description:
            "Connect crowdfunding platforms with your Discord community",
          subItems: {
            managePatronius: {
              label: "Manage Patronius",
              description:
                "Manage your Patronius settings and connected platforms.",
            },
            patroniusGithub: {
              label: "Patronius on GitHub",
              description:
                "Explore Patronius's source code and contribute to the project.",
            },
          },
        },
        investors: {
          subItems: {
            businessIntelligence: {
              label: "Business Intelligence Portal",
              description:
                "Access detailed analytics and real-time reports on company performance.",
            },
            boardManagement: {
              label: "Board Management",
              description:
                "Manage board- and leadership meetings, agendas, and minutes.",
            },
            equityManagement: {
              label: "Equity Management",
              description:
                "Manage and track your shareholder information and equity holdings.",
            },
          },
        },
        customerPortal: {
          label: "Customer Portal via Stripe",
          description: "Manage your payments and payment methods.",
        },
      },
    },
  },
};
