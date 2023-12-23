<script lang="ts">
  import { db, user, storage } from '$lib/client/firebase'
  import Card from '$lib/components/Card.svelte'
  import Dialog from '$lib/components/Dialog.svelte'
  import DialogActions from '$lib/components/DialogActions.svelte'
  import Link from '$lib/components/Link.svelte'
  import Loading from '$lib/components/Loading.svelte'
  import PageLayout from '$lib/components/PageLayout.svelte'
  import ConfirmationForm from '$lib/components/forms/ConfirmationForm.svelte'
  import { getDoc, doc } from 'firebase/firestore'
  import { fade } from 'svelte/transition'
  import Button from '$lib/components/Button.svelte'
  import { onMount } from 'svelte'
  import { fill } from 'lodash-es'

  let pdfUrl =
    'https://raw.githubusercontent.com/hackharvard/portal/7c95d9c559956a4a4f414583a05a9391f2d25d76/certificates.pdf'
  let pageNumber = 0

  let text = ''
  let cantFind = false
  onMount(() => {
    return user.subscribe(async (user) => {
      if (!user) return
      const data = await fetch(
        'https://raw.githubusercontent.com/hackharvard/portal/main/src/data.csv',
      )
      text = await data.text()
      const rows = text.split('\n')
      const headers = rows[0].split(',')
      const fullNameIndex = headers.indexOf('team member')
      const fullName = user.profile.firstName + ' ' + user.profile.lastName
      const fullNameRow = rows.find(
        (row) => row.split(',')[fullNameIndex] === fullName,
      )
      if (fullNameRow) {
        const fullNameRowNumber = rows.indexOf(fullNameRow)
        pageNumber = fullNameRowNumber
      } else {
        cantFind = true
      }
    })
  })

  let fullName = ''

  // when full name changes
  $: {
    if (fullName) {
      const rows = text.split('\n')
      const headers = rows[0].split(',')
      const fullNameIndex = headers.indexOf('team member')
      const fullNameRow = rows.find(
        (row) =>
          row.split(',')[fullNameIndex].toLowerCase() ===
          fullName.toLowerCase(),
      )
      if (fullNameRow) {
        const fullNameRowNumber = rows.indexOf(fullNameRow)
        pageNumber = fullNameRowNumber
      }
    }
  }

  async function downloadCertificate() {
    if (pdfUrl) {
      const pdfjs = await import('pdfjs-dist')
      // pdfjs.GlobalWorkerOptions.workerSrc = '/src/pdf.worker.js'
      const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry')
      pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker

      const pdf = await pdfjs.getDocument(pdfUrl).promise
      const page = await pdf.getPage(pageNumber)

      const scale = 8.0 // Increase the scale for even higher resolution
      const viewport = page.getViewport({ scale })

      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      canvas.height = viewport.height
      canvas.width = viewport.width

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      }

      await page.render(renderContext).promise

      // Get the image data from the canvas as a high-resolution PNG
      const imageData = canvas.toDataURL('image/png', 1.0) // 1.0 quality for high resolution

      // Create a download link for the PNG
      const a = document.createElement('a')
      a.href = imageData
      a.download = `certificate.png`
      a.click()
    }
  }

  type ApplicationStatus = Data.Decision | 'submitted' | null
  type DashboardData = {
    application: {
      status: ApplicationStatus
    }
  }
  let dialogEl: Dialog
  let loading = true
  let data: DashboardData = {
    application: {
      status: null,
    },
  }
  user.subscribe((user) => {
    if (user) {
      let timer: number
      Promise.all([
        new Promise<void>((resolve) => {
          timer = window.setTimeout(resolve, 400)
        }),
        new Promise<void>((resolve) => {
          getDoc(doc(db, 'applications', user.object.uid)).then((snapshot) => {
            if (snapshot.exists()) {
              const applicationData =
                snapshot.data() as Data.Application<'client'>
              if (applicationData.meta.submitted) {
                data.application.status = 'submitted'
                getDoc(doc(db, 'decisions', user.object.uid)).then(
                  (snapshot) => {
                    if (snapshot.exists()) {
                      data.application.status = snapshot.data()
                        .type as Data.Decision
                    }
                    resolve()
                  },
                )
              } else {
                resolve()
              }
            } else {
              resolve()
            }
          })
        }),
      ]).then(() => {
        loading = false
      })
      return () => window.clearTimeout(timer)
    }
  })
</script>

<svelte:head>
  <title>Dashboard</title>
</svelte:head>

<Dialog bind:this={dialogEl} size="full">
  <svelte:fragment slot="title">Hacker Guide</svelte:fragment>
  <div slot="description" class="space-y-4">
    <iframe
      class="h-[calc(100vh-300px)] w-full"
      src="https://docs.google.com/document/d/e/2PACX-1vSG9CCzX3-K99gWP7SjdzaxQ9APRbbhXi2pwlWiFig2q9sbFh3TDjkFY7BQZj3dZXRgf-Ed6VKIqBRc/pub?embedded=true"
    ></iframe>
    <DialogActions>
      <Button on:click={dialogEl.cancel}>Close</Button>
    </DialogActions>
  </div>
</Dialog>

<PageLayout cols={2}>
  <strong>Website under construction. Please come back later.</strong>
</PageLayout>
