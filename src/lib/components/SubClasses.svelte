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
     import Card from "./Card.svelte"
    import { curriculums } from "./helpers/curriculum"

    let feedbackDialogEl: Dialog[] = []
    let notesDialogEl: Dialog[] = []
    let currentUser: Data.User.Store
    let classesMissingSubs: Data.SubRequest[] = []
    let userSubClassesList: Data.SubRequest[] = []
    let loading = true
    let classesCheckedOff: any[] = []
    let updating = false
    let subRequestsFromUser: Data.SubRequest[] = []

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
        let userSubRequests: Data.SubRequest[] = []
        const querySnapshot = await getDocs(q)
        querySnapshot.forEach((doc) => {
            const classInfo = doc.data() as Data.SubRequest
            if (doc.id.includes(userId)) {
                userSubRequests.push({
                ...classInfo, id: doc.id,
                } as Data.SubRequest)
            }
            if (classInfo.subRequestStatus === SubRequestStatus.SubstituteNeeded) {
                classesCheckedOff.push(null)
                classesMissingSubs.push({
                ...classInfo, id: doc.id,
                } as Data.SubRequest)
            } else if ((classInfo.subRequestStatus === SubRequestStatus.SubstituteFound || classInfo.subRequestStatus === SubRequestStatus.SubstituteFeedbackNeeded) && classInfo.subInstructorId === userId) {
                userSubClasses.push({
                ...classInfo, id: doc.id,
                } as Data.SubRequest)
                feedbackDialogEl.push(null)
                notesDialogEl.push(null)
            }
        })
        subRequestsFromUser = userSubRequests
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
                        alert.trigger('success', 'Signup successful!')
                        setTimeout(() => {
                            window.location.reload()
                        }, 1000)
                    } else {
                        alert.trigger('error', 'Error signing up to substitute, please try again.')
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
    getDoc(doc(db, classesCollection, id.split('---')[0])).then((document) => {
      const values = document.data() as Data.Class
      let {meetingLink, classStatuses, completedClassDates, feedbackCompleted} = values;
      const confirmHoldClass = confirm(
        `Please confirm you are holding class now. Confirming will redirect you to ${meetingLink}`,
      )
      if (confirmHoldClass) {
          classStatuses[classNumber - 1] = ClassStatus.FeedbackIncomplete
          completedClassDates.push(dateOfClass)
          const classDoc = doc(db, classesCollection, id.split('---')[0])
           updateDoc(classDoc, {
            completedClassDates: completedClassDates,
            classStatuses: classStatuses,
          }).then(() => {
            updateDoc(doc(db, substituteRequestsCollection, id), {
              subRequestStatus: SubRequestStatus.SubstituteFeedbackNeeded,
          })
        })
          window.open(meetingLink)
        }
      }
    )}

</script>
<div>
    {#await classesMissingSubs then classesMissingSubs}
    <Card>
        <h2 class="font-bold mt-4 text-xl mb-2">Your Classes To Substitute</h2>
    {#if userSubClassesList.length > 0}
    {#each userSubClassesList as classBeingSubbed, i}
    <Dialog bind:this={feedbackDialogEl[i]} size="full" alert>
        <svelte:fragment slot="title"><div class = "flex justify-between items-center">{classBeingSubbed.course} Substitute Class Feedback Form <Button color = 'red' class="font-light" on:click={feedbackDialogEl[i].cancel}>Close</Button></div> </svelte:fragment>
        <div slot="description">
            <InstructorFeedbackForm classBeingSubbed={classBeingSubbed}/>
        </div>
    </Dialog>
    <Dialog bind:this={notesDialogEl[i]} size="min">
            <svelte:fragment slot="title"><div class="flex items-center justify-between"><div>Class Prep Notes</div><Button color="red" on:click={notesDialogEl[i].cancel}>Close</Button></div></svelte:fragment>
        <Card slot="description">
            <p>{classBeingSubbed.notes}</p>
            <br/>
            <p>Please reach out to the class's usual instructor at {classBeingSubbed.originalInstructorEmail} if you have questions!</p>
        </Card>
    </Dialog>
    <hr/>
    <div class={`mt-3 flex items-center justify-between rounded-lg ${classBeingSubbed.subRequestStatus === SubRequestStatus.SubstituteFeedbackNeeded ? 'bg-green-100' : timestampToDate(classBeingSubbed.dateOfClass) < new Date() ? 'bg-red-100' : 'bg-yellow-100'} p-4`}>
        <p>{classBeingSubbed.course} class #{classBeingSubbed.classNumber} at {formatDate(timestampToDate(classBeingSubbed.dateOfClass))}</p>
    </div>
    <div class='text-sm italic'>{classBeingSubbed.subRequestStatus === SubRequestStatus.SubstituteFeedbackNeeded ? 'Please remember to fill out the feedback form for this class!' : timestampToDate(classBeingSubbed.dateOfClass) > new Date() ? 'Please remember to review the notes and prep for the class. Thank you for substituting!' : 'Looks like the substitute class was not held! Please reach out to the usual instructor to let them know.'}</div>
    <Button color = 'blue' class = "mt-2 mb-4" on:click={() => {notesDialogEl[i].open()}}>View Prep Notes</Button>
    <Button color = 'blue' class = "mt-2" on:click={() => window.open(`${curriculums.filter((curriculum) => curriculum.class === classBeingSubbed.course)[0].url}`)}>Curriculum</Button>
    <Button color = 'blue' class = "mt-2" on:click={() => recordClass(classBeingSubbed)}>Join</Button>
    <Button color = 'blue' on:click={() => sendReminder(classBeingSubbed)}> Send Reminder</Button>
    <Button color = 'blue' on:click={() => {feedbackDialogEl[i].open()}}>Submit Feedback</Button>
    {/each}
    {:else}
        <p>You are not currently substituting any classes.</p>
    {/if}
    </Card>
    <Card class = 'mb-2 mt-2'>
    <h2 class="my-2 text-xl font-bold">Your Sub Requests</h2>
    <div>
        {#if subRequestsFromUser.length > 0}
        {#each subRequestsFromUser as subRequest}
            {#if subRequest.subRequestStatus === SubRequestStatus.SubstituteFound}
                <div class="flex items-center justify-between rounded-lg bg-blue-100 p-4 mt-2">
                    <p>{subRequest.course} class #{subRequest.classNumber} at {formatDate(timestampToDate(subRequest.dateOfClass))}</p>
                    <p><strong>Status: Substitute Found</strong></p>
                </div>
            {:else if subRequest.subRequestStatus === SubRequestStatus.SubstituteNeeded}
                <div class="flex items-center justify-between rounded-lg bg-red-100 p-4 mt-2">
                    <p>{subRequest.course} class #{subRequest.classNumber} at {formatDate(timestampToDate(subRequest.dateOfClass))}</p>
                    <p><strong>Status: Substitute Needed</strong></p>
                </div>
            {:else if subRequest.subRequestStatus === SubRequestStatus.SubstituteFeedbackNeeded}
                <div class="flex items-center justify-between rounded-lg bg-yellow-100 p-4 mt-2">
                    <p>{subRequest.course} class #{subRequest.classNumber} at {formatDate(timestampToDate(subRequest.dateOfClass))}</p>
                    <p><strong>Status: Awaiting Substitute Feedback Submission</strong></p>
                </div>
            {:else}
                <div class="flex items-center justify-between rounded-lg bg-green-100 p-4 mt-2">
                    <p>{subRequest.course} class #{subRequest.classNumber} at {formatDate(timestampToDate(subRequest.dateOfClass))}</p>
                    <p><strong>Status: Substituted Class Complete</strong></p>
                </div>
            {/if}
        {/each}
        {:else}
         <p>You have no current sub requests!</p>
        {/if}
    </div>
    </Card>
    <Card>
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
    </Card>
    {/await}
</div>
