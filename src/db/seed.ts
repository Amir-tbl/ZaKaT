import {executeSQL} from './client';
import {donationRepository} from './repositories/donationRepository';
import {applicantRepository} from './repositories/applicantRepository';
import {userRepository} from './repositories/userRepository';

const VALIDATED_APPLICANTS = [
  {
    fullName: 'Marie Dupont',
    city: 'Lyon',
    shortStory: 'Mère de deux enfants, Marie fait face à des frais médicaux imprévus suite à une intervention chirurgicale nécessaire.',
    goalCents: 500000,
    collectedCents: 375000,
  },
  {
    fullName: 'Pierre Martin',
    city: 'Marseille',
    shortStory: 'Pierre, retraité, a besoin d\'aide pour financer ses soins dentaires essentiels non remboursés par la sécurité sociale.',
    goalCents: 300000,
    collectedCents: 180000,
  },
  {
    fullName: 'Sophie Bernard',
    city: 'Paris',
    shortStory: 'Jeune étudiante en médecine, Sophie doit faire face à des frais d\'équipements médicaux pour son stage hospitalier.',
    goalCents: 200000,
    collectedCents: 145000,
  },
  {
    fullName: 'Jean Leclerc',
    city: 'Bordeaux',
    shortStory: 'Jean, artisan boulanger, a besoin de soins de rééducation suite à un accident du travail pour reprendre son activité.',
    goalCents: 400000,
    collectedCents: 220000,
  },
  {
    fullName: 'Isabelle Moreau',
    city: 'Toulouse',
    shortStory: 'Isabelle accompagne son fils dans un parcours de soins spécialisés et a besoin de soutien pour les déplacements.',
    goalCents: 250000,
    collectedCents: 125000,
  },
  {
    fullName: 'François Petit',
    city: 'Nantes',
    shortStory: 'François, père célibataire, doit financer l\'appareillage auditif de sa fille pour qu\'elle puisse suivre sa scolarité.',
    goalCents: 350000,
    collectedCents: 200000,
  },
];

const PENDING_APPLICANTS = [
  {
    fullName: 'Camille Rousseau',
    city: 'Lille',
    shortStory: 'Camille a besoin d\'une aide financière pour ses séances de kinésithérapie suite à une blessure sportive.',
    goalCents: 150000,
    collectedCents: 0,
  },
  {
    fullName: 'Antoine Lefebvre',
    city: 'Strasbourg',
    shortStory: 'Antoine recherche du soutien pour financer les frais de transport vers son centre de dialyse trois fois par semaine.',
    goalCents: 200000,
    collectedCents: 0,
  },
  {
    fullName: 'Claire Dubois',
    city: 'Nice',
    shortStory: 'Claire, jeune maman, a besoin d\'aide pour les frais de consultation avec un spécialiste pour son nouveau-né.',
    goalCents: 180000,
    collectedCents: 0,
  },
];

const MOCK_USER = {
  displayName: 'Utilisateur Demo',
  email: 'demo@donapp.fr',
  notificationsEnabled: true,
};

export async function isSeeded(): Promise<boolean> {
  try {
    const result = await executeSQL(
      "SELECT value FROM meta WHERE key = 'seeded'",
    );
    return result.rows.length > 0 && result.rows.item(0).value === 'true';
  } catch {
    return false;
  }
}

export async function markAsSeeded(): Promise<void> {
  await executeSQL(
    "INSERT OR REPLACE INTO meta (key, value) VALUES ('seeded', 'true')",
  );
}

export async function clearSeeded(): Promise<void> {
  await executeSQL("DELETE FROM meta WHERE key = 'seeded'");
}

export async function seedDatabase(): Promise<void> {
  const alreadySeeded = await isSeeded();
  if (alreadySeeded) {
    return;
  }

  for (const applicant of VALIDATED_APPLICANTS) {
    await executeSQL(
      'INSERT INTO applicants (fullName, city, shortStory, validated, goalCents, collectedCents) VALUES (?, ?, ?, 1, ?, ?)',
      [
        applicant.fullName,
        applicant.city,
        applicant.shortStory,
        applicant.goalCents,
        applicant.collectedCents,
      ],
    );
  }

  for (const applicant of PENDING_APPLICANTS) {
    await executeSQL(
      'INSERT INTO applicants (fullName, city, shortStory, validated, goalCents, collectedCents) VALUES (?, ?, ?, 0, ?, ?)',
      [
        applicant.fullName,
        applicant.city,
        applicant.shortStory,
        applicant.goalCents,
        applicant.collectedCents,
      ],
    );
  }

  await userRepository.create(MOCK_USER);

  const totalCollected = VALIDATED_APPLICANTS.reduce(
    (sum, a) => sum + a.collectedCents,
    0,
  );
  // Trésor initial souhaité: 100 000 € = 10 000 000 cents
  const INITIAL_TREASURY_CENTS = 10000000;
  // Pour avoir: Trésor = Donations - Distribué = INITIAL_TREASURY
  // Il faut: Donations = INITIAL_TREASURY + totalCollected
  const generalDonations = INITIAL_TREASURY_CENTS + totalCollected;

  if (generalDonations > 0) {
    const numDonations = 50;
    const avgDonation = Math.floor(generalDonations / numDonations);
    const baseTime = Date.now() - 30 * 24 * 60 * 60 * 1000;

    for (let i = 0; i < numDonations; i++) {
      const variation = Math.floor(Math.random() * avgDonation * 0.5) - avgDonation * 0.25;
      const amount = Math.max(100, avgDonation + variation);
      const createdAt = baseTime + i * (24 * 60 * 60 * 1000 * 0.6);

      await executeSQL(
        'INSERT INTO donations (amountCents, createdAt, applicantId) VALUES (?, ?, NULL)',
        [amount, createdAt],
      );
    }
  }

  await markAsSeeded();
}

export async function resetDatabase(): Promise<void> {
  await donationRepository.deleteAll();
  await applicantRepository.deleteAll();
  await userRepository.delete();
  await clearSeeded();
  await seedDatabase();
}
