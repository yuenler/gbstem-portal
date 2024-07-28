<script lang="ts">
  import { doc, getDoc, collection, getDocs } from 'firebase/firestore'
  import { onMount } from 'svelte'
  import Loading from '$lib/components/Loading.svelte'
  import Select from '$lib/components/Select.svelte'
  import { db, user } from '$lib/client/firebase'
  import { registrationsCollection } from '$lib/data/constants'
  import { selectedStudentId } from '$lib/stores'

  let loading = true

  let studentsOptions: { name: string }[] = []
  export let selectedStudent = ''
  export let selectedStudentUid = ''
  const nameToUid: Record<string, string> = {}

  const fetchData = async (user: Data.User.Store) => {
    const uid = user.object.uid
    for (let i = 1; i < 6; ++i) {
      const docRef = await getDoc(
        doc(db, registrationsCollection, `${uid}-${i}`),
      )
      if (docRef.exists() && docRef.data()?.meta.submitted) {
        const name =
          `${docRef.data().personal.studentFirstName} ${
            docRef.data().personal.studentLastName
          }`.trim() || `Child ${i}`
        studentsOptions.push({
          name,
        })
        nameToUid[name] = `${uid}-${i}`
      }
    }
  }

  $: if (selectedStudent) {
    const selectedStudentRegistration = studentsOptions.find(
      (option) => option.name === selectedStudent,
    )
    if (selectedStudentRegistration) {
      selectedStudentUid = nameToUid[selectedStudentRegistration.name]
      selectedStudentId.set(selectedStudentUid)
    }
  }

  onMount(() => {
    return user.subscribe(async (userData) => {
      if (userData) {
        if (userData && userData.profile.role === 'student') {
          await fetchData(userData)
        }
        // set the selected student to the first student
        if (studentsOptions.length > 0) {
          selectedStudent = studentsOptions[0].name
        }
        loading = false
      }
    })
  })

  export const load = () => {
    return {
      props: {
        selectedStudentUid: selectedStudentUid,
      }
    }
  }
</script>

<div>
  {#if loading}
    <Loading />
  {:else if studentsOptions.length === 1}
    <div></div>
  {:else}
    <Select
      bind:value={selectedStudent}
      options={studentsOptions}
      label="Select a child"
      floating
    />
  {/if}
</div>
