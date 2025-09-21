import { openDB, DBSchema } from "idb";

interface CollegeInfo {
  id?: number;
  "COLLEGE NAME": string;
  DISTRICT: string;
  TYPE: string;
  COURSES: string;
  SCHOLARSHIPS: string;
  "LINK ": string;
}

// Extend for DB with mapped key for index
interface CollegeInfoForDB extends CollegeInfo {
  collegeName: string;
}

interface CollegesDB extends DBSchema {
  colleges: {
    key: number;
    value: CollegeInfoForDB;
    indexes: { "by-collegeName": string };
  };
}

let dbPromise = openDB<CollegesDB>("CollegesDB", 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains("colleges")) {
      const store = db.createObjectStore("colleges", {
        keyPath: "id",
        autoIncrement: true,
      });
      store.createIndex("by-collegeName", "collegeName");
    }
  },
});

// Adds colleges to DB mapping the spacey key to a no-space key
export async function addColleges(data: CollegeInfo[]) {
  const db = await dbPromise;
  const tx = db.transaction("colleges", "readwrite");
  for (const college of data) {
    const collegeForDB: CollegeInfoForDB = {
      ...college,
      collegeName: college["COLLEGE NAME"],
    };
    await tx.store.put(collegeForDB);
  }
  await tx.done;
}

export async function getAllColleges(): Promise<CollegeInfoForDB[]> {
  const db = await dbPromise;
  return await db.getAll("colleges");
}

// Search using the mapped key for college name along with other keys
export async function searchColleges(query: string): Promise<CollegeInfoForDB[]> {
  const db = await dbPromise;
  const allColleges = await db.getAll("colleges");
  const lower = query.toLowerCase();
  return allColleges.filter(
    (c) =>
      c.collegeName.toLowerCase().includes(lower) ||
      c.DISTRICT.toLowerCase().includes(lower) ||
      c.COURSES.toLowerCase().includes(lower)
  );
}


