const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

const prisma = new PrismaClient();

const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

const demoLeads = [
  {
    name: "Maya Chen",
    email: "maya.chen@brightpathdental.com",
    company: "BrightPath Dental",
    status: "PROPOSAL",
    tags: ["demo", "healthcare", "high-value"],
    summary: "Interested in automating patient follow-ups and reactivation campaigns across two offices.",
    note: "Discovery call went well. Maya wants a simple way to track recall campaigns, missed calls, and unscheduled treatment plans.",
    emailSubject: "Proposal for BrightPath Dental CRM rollout",
    emailType: "FOLLOW_UP",
    sent: true,
    createdDaysAgo: 2
  },
  {
    name: "Jordan Ellis",
    email: "jordan@harborfitness.co",
    company: "Harbor Fitness",
    status: "QUALIFIED",
    tags: ["demo", "fitness", "multi-location"],
    summary: "Needs lead capture, trial pass follow-up, and churn prevention workflows.",
    note: "Jordan asked for pipeline visibility by location and an AI-generated follow-up cadence for trial members.",
    emailSubject: "Next steps for Harbor Fitness lead workflows",
    emailType: "COLD",
    sent: true,
    createdDaysAgo: 4
  },
  {
    name: "Priya Raman",
    email: "priya@northstarhvac.com",
    company: "Northstar HVAC",
    status: "CONTACTED",
    tags: ["demo", "home-services"],
    summary: "Exploring a CRM for estimate follow-ups and seasonal maintenance reminders.",
    note: "Left voicemail and sent a follow-up email with examples for service businesses.",
    emailSubject: "CRM ideas for Northstar HVAC",
    emailType: "FOLLOW_UP",
    sent: true,
    createdDaysAgo: 6
  },
  {
    name: "Luis Ortega",
    email: "luis@elmstreetcoffee.com",
    company: "Elm Street Coffee",
    status: "NEW",
    tags: ["demo", "retail", "local"],
    summary: "Downloaded the small-business sales checklist and requested a demo.",
    note: "Inbound lead from website. Good fit for loyalty outreach and catering pipeline tracking.",
    emailSubject: "Thanks for reaching out to AI CRM",
    emailType: "COLD",
    sent: false,
    createdDaysAgo: 1
  },
  {
    name: "Avery Brooks",
    email: "avery@greenlinecleaning.com",
    company: "Greenline Cleaning",
    status: "WON",
    tags: ["demo", "services", "customer-success"],
    summary: "Signed up for CRM setup focused on commercial cleaning contracts.",
    note: "Closed starter package. Onboarding call scheduled for Monday with account setup checklist.",
    emailSubject: "Welcome to AI CRM",
    emailType: "CUSTOM",
    sent: true,
    createdDaysAgo: 9
  },
  {
    name: "Samira Patel",
    email: "samira@urbanbloomstudio.com",
    company: "Urban Bloom Studio",
    status: "PROPOSAL",
    tags: ["demo", "creative", "proposal"],
    summary: "Wants follow-up automation for wedding and event floral inquiries.",
    note: "Proposal sent with lead forms, quote reminders, and seasonal campaign examples.",
    emailSubject: "Urban Bloom CRM proposal",
    emailType: "FOLLOW_UP",
    sent: true,
    createdDaysAgo: 3
  },
  {
    name: "Noah Williams",
    email: "noah@apexaccounting.io",
    company: "Apex Accounting",
    status: "CONTACTED",
    tags: ["demo", "professional-services"],
    summary: "Interested in tracking referral partners and tax-season follow-ups.",
    note: "Noah requested a short product walkthrough with sample CPA firm workflows.",
    emailSubject: "Referral CRM workflow examples",
    emailType: "COLD",
    sent: true,
    createdDaysAgo: 7
  },
  {
    name: "Elena Torres",
    email: "elena@ridgeviewrealty.com",
    company: "Ridgeview Realty",
    status: "LOST",
    tags: ["demo", "real-estate"],
    summary: "Chose to stay with current real estate platform for now.",
    note: "Good relationship. Re-engage next quarter after team reviews budget.",
    emailSubject: "Checking in next quarter",
    emailType: "RE_ENGAGEMENT",
    sent: false,
    createdDaysAgo: 15
  }
];

async function main() {
  let user = await prisma.user.findFirst({ orderBy: { createdAt: "desc" } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: "Demo Owner",
        email: "demo@example.com",
        passwordHash: await bcrypt.hash("password123", 10),
        company: "AI CRM Demo"
      }
    });
    console.log("Created demo user: demo@example.com / password123");
  }

  await prisma.lead.deleteMany({
    where: {
      userId: user.id,
      tags: { has: "demo" }
    }
  });

  for (const lead of demoLeads) {
    await prisma.lead.create({
      data: {
        name: lead.name,
        email: lead.email,
        company: lead.company,
        status: lead.status,
        tags: lead.tags,
        summary: lead.summary,
        userId: user.id,
        createdAt: daysAgo(lead.createdDaysAgo),
        updatedAt: daysAgo(Math.max(0, lead.createdDaysAgo - 1)),
        notes: {
          create: {
            content: lead.note,
            aiSummary: {
              priority: lead.status === "PROPOSAL" ? "high" : "medium",
              nextStep: lead.status === "WON" ? "Begin onboarding" : "Follow up this week"
            },
            createdAt: daysAgo(Math.max(0, lead.createdDaysAgo - 1)),
            updatedAt: daysAgo(Math.max(0, lead.createdDaysAgo - 1))
          }
        },
        emails: {
          create: {
            to: lead.email,
            subject: lead.emailSubject,
            body: `Hi ${lead.name.split(" ")[0]},\n\nThanks for taking a look at AI CRM. Based on what you shared, I put together a practical next step for ${lead.company} so your team can follow up faster and keep every opportunity visible.\n\nBest,\nAI CRM Team`,
            type: lead.emailType,
            sent: lead.sent,
            error: lead.sent ? null : "Queued for demo screenshot",
            createdAt: daysAgo(Math.max(0, lead.createdDaysAgo - 1))
          }
        }
      }
    });
  }

  const counts = await prisma.lead.groupBy({
    by: ["status"],
    where: { userId: user.id },
    _count: { status: true }
  });

  console.log(`Seeded ${demoLeads.length} demo leads for ${user.email}`);
  console.table(counts.map((row) => ({ status: row.status, count: row._count.status })));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
