import type {
  DocumentReference as ServerDocumentReference,
  Timestamp as ServerTimestamp,
} from 'firebase-admin/firestore'
import type {
  DocumentReference as ClientDocumentReference,
  Timestamp as ClientTimestamp,
} from 'firebase/firestore'
import type { User as ClientUser } from 'firebase/auth'

declare global {
  declare namespace Data {
    type Role = 'admin' | 'reviewer' | 'instructor' | 'student'

    type Token<T extends 'client' | 'server' | 'pojo'> = {
      role: Role
      expires: T extends 'client'
      ? ClientTimestamp
      : T extends 'server'
      ? ServerTimestamp
      : Date
      consumable: boolean
      consumers: Array<string>
    }

    namespace User {
      type Peek = {
        uid: string
        email: string
        emailVerified: boolean
        role: Role
      }
      type Profile = {
        firstName: string
        lastName: string
        id: string
        role: Role
      }
      type Store = {
        object: ClientUser
        profile: Profile
      }
    }

    type Resume = {
      url: string
      name: string
    }

    type Decision = 'accepted' | 'waitlisted' | 'rejected'


    export type ApplicationData = {
      personal: {
        email: string
        firstName: string
        lastName: string
        dateOfBirth: string
        gender: string
        race: string[]
        phoneNumber: string
      }
      academic: {
        school: string
        graduationYear: string
      }
      program: {
        courses: string[]
        preferences: string
        numClasses: string
        timeSlots: string[]
        notAvailable: string
        inPerson: boolean
        reason: string
      }
      essay: {
        taughtBefore: boolean
        academicBackground: string
        teachingScenario: string
        why: string
      }
      agreements: {
        entireProgram: boolean
        timeCommitment: boolean
        submitting: boolean
      }
      meta: {
        id: string
        uid: string
        submitted: boolean
      }
      timestamps: {
        created: Timestamp
        updated: Timestamp
      }
    }

    type EmailData = {
      Subject: string,
      From: string,
      To: string,
      HTMLBody: string,
      ReplyTo: string,
      MessageStream: 'outbound'
    }

    type Application = {
      personal: {
        email: string
        firstName: string
        lastName: string
        dateOfBirth: string
        gender: string
        race: string[]
        phoneNumber: string
      }
      academic: {
        school: string
        graduationYear: string
      }
      program: {
        courses: string[]
        preferences: string
        numClasses: string
        timeSlots: string[]
        notAvailable: string
        inPerson: boolean
        reason: string
      }
      essay: {
        taughtBefore: boolean
        academicBackground: string
        teachingScenario: string
        why: string
      }
      agreements: {
        entireProgram: boolean
        timeCommitment: boolean
        submitting: boolean
      }
      meta: {
        id: string
        uid: string
        submitted: boolean
      }
      timestamps: {
        created: Timestamp
        updated: Timestamp
      }
    }




    type Registration = {
      personal: {
        email: string
        studentFirstName: string
        studentLastName: string
        parentFirstName: string
        parentLastName: string
        secondaryEmail: string
        dateOfBirth: string
        gender: string
        race: string[]
        phoneNumber: string
        frlp: string
        parentEducation: string
      }
      academic: {
        school: string
        grade: string
      }
      program: {
        csCourse: string
        mathCourse: string
        engineeringCourse: string
        scienceCourse: string
        timeSlots: string[]
        reason: string
        inPerson: boolean
      }
      agreements: {
        entireProgram: boolean
        timeCommitment: boolean
        submitting: boolean
      }
      meta: {
        id: string
        uid: string
        submitted: boolean
      }
      timestamps: {
        created: Timestamp
        updated: Timestamp
      }
    }

    type ApplicationHackHarvard<T extends 'client' | 'server' | 'pojo'> = {
      personal: {
        email: string
        firstName: string
        lastName: string
        age: string
        gender: string
        race: string[]
        underrepresented: string
        phoneNumber: string
        countryOfResidence: string
        shippingAddress: string
        shippingCity: string
        shippingState: string
        shippingCountry: string
        shippingZipCode: string
        dietaryRestrictions: string[]
      }
      academic: {
        enrolled: boolean
        currentSchool: string
        graduationYear: string
        major: string
        affiliated: boolean
        levelOfStudy: string
      }
      hackathon: {
        shirtSize: string
        firstHackathon: boolean
        previouslyParticipated: boolean
        ableToAttend: boolean
        reason: string
      }
      openResponse: {
        roles: string[]
        otherRole: string
        prolangs: string[]
        otherProlang: string
        experience: string
        whyHh: string
        project: string
        predictions: string
        resume: Resume
        resumeShare: boolean
      }
      agreements: {
        codeOfConduct: boolean
        sharing: boolean
        mlhEmails: boolean
        submitting: boolean
      }
      meta: {
        id: string
        uid: string
        submitted: boolean
        decision:
        | (T extends 'client'
          ? ClientDocumentReference
          : T extends 'server'
          ? ServerDocumentReference
          : Decision)
        | null
      }
      timestamps: {
        created: T extends 'client'
        ? ClientTimestamp
        : T extends 'server'
        ? ServerTimestamp
        : Date
        updated: T extends 'client'
        ? ClientTimestamp
        : T extends 'server'
        ? ServerTimestamp
        : Date
      }
    }

    type Announcement<T extends 'client' | 'server' | 'pojo'> = {
      title: string
      content: string
      timestamp: T extends 'client'
      ? ClientTimestamp
      : T extends 'server'
      ? ServerTimestamp
      : Date
    }
  }
}
