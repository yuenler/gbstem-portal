<script lang="ts">
    import { db, user } from "$lib/client/firebase"
    import Button from "$lib/components/Button.svelte"
    import Card from "$lib/components/Card.svelte"
    import InterviewForm from "$lib/components/forms/InterviewForm.svelte";
    import { ClassStatus } from "$lib/components/helpers/ClassStatus"
    import { SubRequestStatus } from "$lib/components/helpers/SubRequestStatus"
    import PageLayout from "$lib/components/PageLayout.svelte";
    import { classesCollection, substituteRequestsCollection } from "$lib/data/constants"
    import { timestampToDate } from "$lib/utils"
    import { collection, doc, getDoc, getDocs, query } from "firebase/firestore"
    import { alert } from '$lib/stores'

    let numHours = 0
    let numRegHours = 0
    let numSubHours=0
    let currentUser: Data.User.Store
    let year: number = new Date().getFullYear()
    let isFall = false
    let course = ''

    user.subscribe((user) => {
        if(user) {
        currentUser = user
        getDoc(doc(db, classesCollection, user.object.uid)).then((doc) => {
            if (doc.exists()) {
                const data = doc.data() as Data.Class
                numRegHours = data.classStatuses.filter((classStatus) => classStatus === ClassStatus.EverythingComplete || classStatus === ClassStatus.FeedbackIncomplete).length
                numHours = numHours + numRegHours
                course = data.course
                const startDate = timestampToDate(data.meetingTimes[0])
                isFall = startDate.getMonth() > 6
                year = startDate.getFullYear()
            }
        }).then(() => {
            const q = query(collection(db, substituteRequestsCollection));
            getDocs(q).then((document) => {
                document.forEach((doc) => {
                    const data = doc.data() as Data.SubRequest
                    if (data.subInstructorId === user.object.uid && data.subRequestStatus === SubRequestStatus.NoSubstituteNeeded) {
                        numHours = numHours + 1
                        numSubHours = numSubHours + 1
                    }
                })
            })
        });
     }
    });

    function sendEmail() {
        fetch('/api/communityService', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                firstName: currentUser.profile.firstName,
                hours: numHours,
                season: isFall ? "fall" : "spring",
                course: course,
                email: currentUser.object.email,
                year: year,
                presidents: 'Kendree Chen, Dea Pance, and Michael Bolgov',
            })
        }).then((response) => {
            if (response.ok) {
                alert.trigger('success', "Email sent successfully!")
            } else {
                alert.trigger('error', "Failed to send email.")
            }
        })
    }

</script>

<svelte:head>
  <title>Community Service Hours Tracker</title>
</svelte:head>

<PageLayout cols={2}>
    <svelte:fragment slot="title">Community Service Hours Tracker</svelte:fragment>
    <div class="relative w-full">
        <Card>
            <div class="p-2">
                <h2 class="text-lg font-bold">You have completed {numHours} total hours of community service this year!</h2>
                <div>You have completed <strong>{numRegHours}</strong> hour{numRegHours === 1 ? '' : 's'} of instruction for your class and <strong>{numSubHours}</strong> hour{numSubHours === 1 ? '' : 's'}  as a substitute instructor. Thank you for contributing to gbSTEM.</div>
                <Button color="blue" class="mt-2" on:click={sendEmail}>Get Hours Confirmation Email</Button>
            </div>
        </Card>
    </div>
</PageLayout>