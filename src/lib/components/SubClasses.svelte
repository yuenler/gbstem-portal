<script lang="ts">
    import { onMount } from "svelte"
    import { db, user } from '$lib/client/firebase'
    import { collection, doc, DocumentReference, getDoc, getDocs, query, updateDoc } from "firebase/firestore"
    import { classesCollection, registrationsCollection, substituteRequestsCollection } from "$lib/data/constants"
    import { SubRequestStatus } from "./helpers/SubRequestStatus"
    import { classTodayHeld, formatDate, timestampToDate } from "$lib/utils"
    import Button from "./Button.svelte"
    import { enhance } from "$app/forms"
    import { alert } from "$lib/stores"
    import { ClassStatus } from "./helpers/ClassStatus"
    import sendClassReminder from "./helpers/sendClassReminder"
    import type Student from "./types/Student"
     import Dialog from './Dialog.svelte'
     import InstructorFeedbackForm from './forms/InstructorFeedbackForm.svelte'

    let feedbackDialogEl: Dialog
    let currentUser: Data.User.Store
    let classesMissingSubs: Data.SubRequest[] = []
    let userSubClassesList: Data.SubRequest[] = []
    let loading = true
    let classesCheckedOff: any[] = []
    let updating = false

    onMount(() => {
        return user.subscribe(async (user) => {
      if (user) {
        currentUser = user
        loading = false
        classesMissingSubs = await getData(user.object.uid)
      }
        })
    })

    async function getData(userId: string) {
        const q = query(collection(db, substituteRequestsCollection))
        let userSubClasses: Data.SubRequest[] = []
        const querySnapshot = await getDocs(q)
        querySnapshot.forEach((doc) => {
            const classInfo = doc.data() as Data.SubRequest
            if (classInfo.subRequestStatus === SubRequestStatus.SubstituteNeeded) {
                classesCheckedOff.push(null)
                classesMissingSubs.push({
                ...classInfo, id: doc.id,
                } as Data.SubRequest)
            } else if (classInfo.subRequestStatus === SubRequestStatus.SubstituteFound && classInfo.subInstructorId === userId) {
                userSubClasses.push({
                ...classInfo, id: doc.id,
                } as Data.SubRequest)
            }
        })
        userSubClassesList = userSubClasses
        return classesMissingSubs;
    }

    function handleSubmit() {
        const classesToSub = classesCheckedOff.filter((classCheckedOff: any) => classCheckedOff !== null).map((classCheckedOff: any) => classCheckedOff[0])
        classesToSub.map((classToSub: Data.SubRequest) => {
            const classToSubDoc = doc(db, substituteRequestsCollection, classToSub.id)
            updateDoc(classToSubDoc, {
                subRequestStatus: SubRequestStatus.SubstituteFound,
                subInstructorId: currentUser.object.uid,
                subInstructorFirstName: currentUser.profile.firstName,
                subInstructorEmail: currentUser.object.email,
            }).then(() => {
                classesMissingSubs = classesMissingSubs.filter((classMissingSub) => classMissingSub.id !== classToSub.id)
                userSubClassesList.push(classToSub)
                fetch('api/substitute', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        firstName: currentUser.profile.firstName,
                        subInstructorEmail: currentUser.object.email,
                        course: classToSub.course,
                        classNumber: classToSub.classNumber,
                        date: formatDate(timestampToDate(classToSub.dateOfClass)),
                        originalInstructorEmail: classToSub.originalInstructorEmail,
                    }),
                }).then((response) => {
                    if (response.ok) {
                        alert.trigger('success', 'Substitute request sent!')
                    } else {
                        alert.trigger('error', 'Error sending substitute request!')
                    }
                })
            })
        })
    }

function getStudentList(studentUids: string[]): Promise<Student[]> {
    let studentList: Student[] = []
    
    const studentPromises = studentUids.map(async (studentUid) => {
        const studentDocRef: DocumentReference = doc(
            db,
            registrationsCollection,
            studentUid,
        )
        const studentDoc = await getDoc(studentDocRef)
        if (studentDoc.exists()) {
            const data = studentDoc.data()
            if (data) {
                const student: Student = {
                    name: `${data.personal.studentFirstName} ${data.personal.studentLastName}`,
                    email: data.personal.email,
                    secondaryEmail: data.personal.secondaryEmail,
                    phone: data.personal.phoneNumber,
                    grade: data.academic.grade,
                    school: data.academic.school,
                }
                studentList.push(student)
            }
        }
    })

    return Promise.all(studentPromises).then(() => studentList)
}

    function sendReminder(subRequest:Data.SubRequest) {            
        let {course, subInstructorEmail, subInstructorFirstName, dateOfClass, id} = subRequest;
        getDoc(doc(db, classesCollection, id)).then(async (document) => {
        const values = await document.data() as Data.Class
        let {students} = values;
        const studentList = await getStudentList(students)
        sendClassReminder({
            studentList: studentList,
            className: course,
            instructorName: subInstructorFirstName,
            instructorEmail: subInstructorEmail,
            nextMeetingTime: formatDate(timestampToDate(dateOfClass)),
            otherInstructorEmails: '',  
        })
      })
    }

    function recordClass(subRequest: Data.SubRequest) {
    let {classNumber, dateOfClass, id} = subRequest;
    getDoc(doc(db, classesCollection, id)).then((document) => {
      const values = document.data() as Data.Class
      let {meetingLink, classStatuses, completedClassDates, feedbackCompleted} = values;
      const confirmHoldClass = confirm(
        `Please confirm you are holding class now. Confirming will redirect you to ${meetingLink}`,
      )
      if (confirmHoldClass) {
          classStatuses[classNumber] = ClassStatus.FeedbackIncomplete
          completedClassDates.push(dateOfClass)
          feedbackCompleted[classNumber] = true
          const classDoc = doc(db, classesCollection, id)
           updateDoc(classDoc, {
            completedClassDates: completedClassDates,
            classStatuses: classStatuses,
            feedbackCompleted: feedbackCompleted,
          })
        }
        window.open(meetingLink)
      }
    )}

</script>
<div>
    {#await classesMissingSubs then classesMissingSubs}
    <h2 class="ml-2 mt-2 text-xl font-bold">Substituting Classes</h2>
    <hr class="mb-3 mt-5" />
    <h2 class="font-bold mb-2">Sign Up To Substitute A Class</h2>
    {#if classesMissingSubs.length > 0}
    <form 
    method="POST"
    use:enhance={() => {
		updating = true;

		return async ({ update }) => {
			await update();
			updating = false;
		};
	}}>
    {#each classesMissingSubs as classToSub, i}
    <div>
    <label>
        <input        
        type="checkbox"
        bind:group={classesCheckedOff[i]}
        disabled={updating}
        value={classToSub}
        />
        {classToSub.course}, class #{classToSub.classNumber}, at {formatDate(timestampToDate(classToSub.dateOfClass))}
     </label>
    </div>
    {/each}
    <Button color="blue" class = "mt-2" on:click={handleSubmit} >Submit</Button>
    </form>
    {#if updating}
	<span class="saving">saving...</span>
    {/if}
    {:else}
    <p>No current sub requests!</p>
    {/if}
    <h2 class="font-bold mt-4 mb-2">Your Classes To Substitute</h2>
    {#if userSubClassesList.length > 0}
    {#each userSubClassesList as classBeingSubbed, i}
    <InstructorFeedbackForm bind:feedbackDialogEl classBeingSubbed={classBeingSubbed}/>
    <hr/>
    <div>
        <p>{classBeingSubbed.course} class #{classBeingSubbed.classNumber} at {formatDate(timestampToDate(classBeingSubbed.dateOfClass))}</p>
    </div>
    <Button color = 'blue' class = "mt-2" on:click={() => recordClass(classBeingSubbed)}>Join Class</Button>
    <Button color = 'blue' class = "mb-2" on:click={() => {feedbackDialogEl.open()}}>Submit Feedback</Button>
    <Button color = 'blue' on:click={() => sendReminder(classBeingSubbed)}> Send Class Reminder</Button>
    {/each}
    {:else}
        <p>You are not currently substituting any classes.</p>
    {/if}
    {/await}
</div>
