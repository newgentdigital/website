export const nav = {
  mainNavigation: "Huvudnavigering",
  returnToNewgent: "Tillbaka till Newgent",
  mobileMenu: "Meny",
  links: {
    aboutUs: "Om oss",
    work: "Arbete",
    contact: "Kontakt",
    connections: "Anslutningar",
    dataAndDashboards: "Data & dashboards",
    securityStack: "Säkerhetsstack",
    setup: "Setup",
    about: "Om",
    getStarted: "Kom igång",
    dashboards: "Dashboards",
    dataPipelines: "Datapipelines",
    paymentProviders: "Betalningsleverantörer",
    accounting: "Bokföring & skatt",
    crowdfunding: "Crowdfunding-plattformar",
    rewardChannels: "Belöningskanaler",
    scanEngines: "Skanningsmotorer",
    alerting: "Varningar & övervakning",
  },
  megaMenu: {
    newgent: {
      designServices: {
        label: "Designtjänster",
        items: {
          brandIdentity: {
            label: "Varumärkesidentitet",
            description:
              "Samhållande varumärkesidentiteter som resonerar med din publik.",
          },
          graphicDesign: {
            description:
              "Marknadsföringsmaterial, illustrationer och kreativa tillgångar.",
          },
          uiUxDesign: {
            label: "UI/UX Design",
            description: "Användargränssnittsdesign för webben och mobiler.",
          },
        },
      },
      mediaProduction: {
        label: "Medieproduktion",
        items: {
          videoProduction: {
            description:
              "Videoinnehåll för marknadsföring, utbildning och berättande.",
          },
          photography: {
            description:
              "Fotografitjänster för evenemang, produkter och varumärken.",
          },
        },
      },
      featuredItem: {
        title: "Se vad vi har skapat",
        description:
          "Utforska case studies och riktiga projekt från nordiska varumärken som litar på Newgent med sin kreativa vision och kommunikation.",
        ctaLabel: "Visa case studies",
      },
    },
    discern: {
      integrations: {
        metabaseDescription:
          "Visualisera Discord-analys i vackra, interaktiva dashboards.",
        grafanaDescription:
          "Övervaka community-metrics i realtid med anpassade varningar.",
      },
      destinations: {
        clickhouseDescription:
          "Lagra community-data effektivt för blixtsnabb analys.",
        influxdbDescription: "Följ tidsseriedata med högpresterande lagring.",
        postgresqlDescription:
          "Lagra Discord-analytikdata i en relationsdatabas.",
      },
      automation: {
        zapierDescription:
          "Automatisera Discord-insikter till CRM:er, kalkylblad och mer utan kod.",
        n8nDescription:
          "Orkestrera avancerade flöden och datasynkar med full kontroll.",
      },
      featuredItem: {
        title: "Hur communities växer med data",
        description:
          "Se hur Discord-servrar förvandlade analys till handling. Riktiga berättelser från marknadsförare och community managers som skalade smartare.",
        ctaLabel: "Läs framgångshistorier",
      },
    },
    finconnect: {
      integrations: {
        stripeDescription:
          "Automatisera avstämning av betalningar och prenumerationer.",
        wiseDescription:
          "Synka internationella transaktioner automatiskt till din bokföring.",
        revolutDescription:
          "Anslut företagskonton för sömlös utgiftsuppföljning.",
      },
      destinations: {
        fortnoxDescription:
          "Automatisera svensk bokföring med direkt transaktionssynk.",
        skatteverketDescription:
          "Generera skatterapporter automatiskt från anslutna leverantörer.",
      },
      featuredItem: {
        title: "Från timmar till minuter: Kundberättelser",
        description:
          "Företag och revisorer delar hur Finconnect eliminerade manuell bokföring genom att anta automation. Se tiden som sparats och misstagen som undvikits.",
        ctaLabel: "Läs deras berättelser",
      },
    },
    patronius: {
      integrations: {
        openCollectiveDescription:
          "Belöna backers direkt med automatiska Discord-förmåner.",
        liberaPayDescription:
          "Ge supportrar roller automatiskt när donationer anländer.",
        githubSponsorsDescription:
          "Ge sponsorer exklusiv tillgång till din Discord-community.",
        thanksDevDescription:
          "Belöna open source-bidragsgivare med automatiska Discord-belöningar.",
      },
      destinations: {
        discordDescription:
          "Tilldela förmåner automatiskt via självbetjäningsverifiering.",
        grafanaDescription:
          "Följ donatorsengagemang och belöningsdistributionsanalys.",
        zapierDescription:
          "Automatisera synkronisering av supporterdata—utan kod.",
      },
      featuredItem: {
        title: "Skapare som belönade smartare",
        description:
          "Lär av open source-projekt och innehållsskapare som automatiserade supporterbelöningar. Läs guider, se verkliga resultat och belöna dina supportrar.",
        ctaLabel: "Se installationsguider",
      },
    },
    shellguard: {
      integrations: {
        clamavDescription:
          "Skanna bilagor automatiskt med pålitligt open-source-skydd.",
        virusTotalDescription:
          "Kontrollera filer mot 70+ antivirusmotorer direkt.",
        hybridAnalysisDescription:
          "Analysera misstänkta filer med avancerad beteendedetektering.",
        triageDescription:
          "Djupgående malware-analys för omfattande hotinformation.",
      },
      destinations: {
        discordDescription: "Varna moderatorer direkt när hot upptäcks.",
        grafanaDescription:
          "Övervaka säkerhetsmetrics och skanningsresultat i realtid.",
        prometheusDescription:
          "Spåra säkerhetsmetrics och hotdetektionshastigheter över tid.",
      },
      featuredItem: {
        title: "Communities skyddade från hot",
        description:
          "Riktiga incidenter som fångades av Shellguard. Lär av serveradministratörer och community-moderatorer som stoppade attacker innan de spred sig.",
        ctaLabel: "Visa kundberättelser",
      },
    },
  },
  actionbar: {
    label: "Åtgärdsfält",
    serviceStatus: "Tjänstestatus",
    login: "Logga in",
    platforms: {
      label: "Plattformar",
      items: {
        newgent: {
          label: "Newgent Digital",
          description: "Allt-i-ett nordisk mediebyrå",
        },
        finconnect: {
          label: "Finconnect",
          description: "Sveriges mest öppna finansintegration",
          subItems: {
            manageFinconnect: {
              label: "Hantera Finconnect",
              description:
                "Hantera dina Finconnect-inställningar och integrationer.",
            },
            finconnectGithub: {
              label: "Finconnect på GitHub",
              description:
                "Utforska Finconnects källkod och bidra till projektet.",
            },
          },
        },
        discern: {
          label: "Discern",
          description: "Förvandla Discord till en marknadsföringsmotor",
          subItems: {
            manageDiscern: {
              label: "Hantera Discern",
              description:
                "Hantera dina Discern-inställningar och anslutna servrar.",
            },
            discernGithub: {
              label: "Discern på GitHub",
              description:
                "Utforska Discerns källkod och bidra till projektet.",
            },
          },
        },
        shellguard: {
          label: "Shellguard",
          description: "Skanna Discord efter skadligt innehåll och virus",
          subItems: {
            manageShellguard: {
              label: "Hantera Shellguard",
              description:
                "Hantera dina Shellguard-inställningar och skannade servrar.",
            },
            shellguardGithub: {
              label: "Shellguard på GitHub",
              description:
                "Utforska Shellguards källkod och bidra till projektet.",
            },
          },
        },
        patronius: {
          label: "Patronius",
          description:
            "Koppla crowdfunding-plattformar till din Discord-community",
          subItems: {
            managePatronius: {
              label: "Hantera Patronius",
              description:
                "Hantera dina Patronius-inställningar och anslutna plattformar.",
            },
            patroniusGithub: {
              label: "Patronius på GitHub",
              description:
                "Utforska Patronius källkod och bidra till projektet.",
            },
          },
        },
        investors: {
          subItems: {
            businessIntelligence: {
              label: "Business Intelligence-portal",
              description:
                "Få tillgång till detaljerad analys och realtidsrapporter om företagsresultat.",
            },
            boardManagement: {
              label: "Styrelseförvaltning",
              description:
                "Hantera styrelse- och ledningsmöten, agendor och protokoll.",
            },
            equityManagement: {
              label: "Aktieförvaltning",
              description:
                "Hantera och spåra din aktieinformation och aktieinnehav.",
            },
          },
        },
        customerPortal: {
          label: "Kundportal via Stripe",
          description: "Hantera dina betalningar och betalningsmetoder.",
        },
      },
    },
  },
};
