/**
 * MARKAZ PRINTING v3.0 — Firebase Seed Data
 * Powered by Buana Studios for Yayasan T.I.B.Y.A.N.
 *
 * HOW TO USE:
 * Open your app in the browser (served over HTTP with a live server),
 * open the browser console (F12), paste this entire script and press Enter.
 * It will write the initial users to Firestore once.
 *
 * Only needs to be run ONCE on a fresh Firestore database.
 */

(async function seedFirestore() {
  if (typeof db === 'undefined') {
    console.error('[Seed] Firebase not initialized. Make sure the app is loaded first.');
    return;
  }

  const usersToSeed = [
    {
      email: 'admin@tibyan.org',
      name: 'Super Admin Sekretariat',
      role: 'ADMIN',
      department: 'Sekretariat Utama',
      status: 'ACTIVE'
    },
    {
      email: 'guru@tibyan.org',
      name: 'Guru At-Tibyan',
      role: 'USER',
      department: 'Pengajar SD/SMP',
      status: 'ACTIVE'
    },
    {
      email: 'kepala@tibyan.org',
      name: 'Kepala Sekolah',
      role: 'VIEWER',
      department: 'Manajemen Sekolah',
      status: 'ACTIVE'
    }
  ];

  const batch = db.batch();

  usersToSeed.forEach(user => {
    const ref = db.collection('users').doc(user.email);
    batch.set(ref, {
      ...user,
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  });

  try {
    await batch.commit();
    console.log('%c[Seed] ✅ Users seeded successfully to Firestore!', 'color: green; font-weight: bold;');
    console.table(usersToSeed);
  } catch (err) {
    console.error('[Seed] ❌ Failed to seed users:', err);
  }
})();
