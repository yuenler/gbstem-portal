<script lang="ts">
    import { onMount } from "svelte"
    import { db, user } from '$lib/client/firebase'
    import { collection, doc, getDocs, query, updateDoc } from "firebase/firestore"
    import { substituteRequestsCollection } from "$lib/data/constants"
    import { SubRequestStatus } from "./helpers/SubRequestStatus"
    import { formatDate, timestampToDate } from "$lib/utils"
    import Button from "./Button.svelte"

    let currentUser: Data.User.Store
    let classesMissingSubs: Data.SubRequest[] = []
    let userSubClassesList: Data.SubRequest[] = []
    let loading = true
    let classesCheckedOff: any[] = []

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
        const querySnapshot = await getDocs(q)
        querySnapshot.forEach((doc) => {
            const classInfo = doc.data() as Data.SubRequest
            console.log(classInfo)
            if (classInfo.subRequestStatus === SubRequestStatus.SubstituteNeeded) {
                classesCheckedOff.push(null)
                classesMissingSubs.push({
                ...classInfo, id: doc.id,
                } as Data.SubRequest)
            } else if (classInfo.subRequestStatus === SubRequestStatus.SubstituteFound && classInfo.subInstructorId === userId) {
                userSubClassesList.push({
                ...classInfo, id: doc.id,
                } as Data.SubRequest)
            }
        })
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
            })
        })
    }

</script>
<div>
    {#await classesMissingSubs then classesMissingSubs}
    <h2 class="ml-2 mt-2 text-xl font-bold">Substituting Classes</h2>
    <hr class="mb-3 mt-5" />
    <h2 class="font-bold mb-2">Sign Up To Substitute A Class</h2>
    {#if classesMissingSubs.length > 0}
    {#each classesMissingSubs as classToSub, i}
    <div>
    <label>
        <input
        type="checkbox"
        bind:group={classesCheckedOff[i]}
        value={classToSub}
        />
        {classToSub.course}, class #{classToSub.classNumber}, at {formatDate(timestampToDate(classToSub.dateOfClass))}
     </label>
    </div>
    {/each}
    <Button color="blue" on:click={handleSubmit}>Submit</Button>
    {:else}
    <p>No current sub requests!</p>
    {/if}
    <h2 class="font-bold mt-4 mb-2">Your Classes To Substitute</h2>
    {#if userSubClassesList.length > 0}
    {#each userSubClassesList as classBeingSubbed}
    <div>
        <p>{classBeingSubbed.course}, class #{classBeingSubbed.classNumber}, at {formatDate(classBeingSubbed.dateOfClass)}</p>
    </div>
    {/each}
    {:else}
        <p>You are not currently substituting any classes.</p>
    {/if}
    {/await}
</div>
