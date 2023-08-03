<script lang="ts">
  import clsx from 'clsx'
  import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
    addDoc,
    collection,
  } from 'firebase/firestore'
  import Input from '$lib/components/Input.svelte'
  import Select from '$lib/components/Select.svelte'
  import Textarea from '$lib/components/Textarea.svelte'
  import {
    gendersJson,
    schoolsJson,
    shirtSizeJson,
    dietaryRestrictionsJson,
    rolesJson,
    raceJson,
    prolangsJson,
    statesJson,
    worldJson,
    majorJson,
    reasonsJson,
    experienceJson,
    levelOfStudyJson,
  } from '$lib/data'
  import { alert } from '$lib/stores'
  import { onDestroy, onMount } from 'svelte'
  import Card from '$lib/components/Card.svelte'
  import Form from '$lib/components/Form.svelte'
  import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
  import { db, storage, user, type ApplicationData } from '$lib/client/firebase'
  import { cloneDeep, isEqual } from 'lodash-es'
  import Field from '$lib/components/Field.svelte'

  let applicationConfirmationEmail = `
  <!DOCTYPE HTML
  PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:o="urn:schemas-microsoft-com:office:office">

<head>
  <!--[if gte mso 9]>
<xml>
  <o:OfficeDocumentSettings>
    <o:AllowPNG/>
    <o:PixelsPerInch>96</o:PixelsPerInch>
  </o:OfficeDocumentSettings>
</xml>
<![endif]-->
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <!--[if !mso]><!-->
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <!--<![endif]-->
  <title></title>

  <style type="text/css">
    @media only screen and (min-width: 520px) {
      .u-row {
        width: 500px !important;
      }

      .u-row .u-col {
        vertical-align: top;
      }

      .u-row .u-col-100 {
        width: 500px !important;
      }
    }

    @media (max-width: 520px) {
      .u-row-container {
        max-width: 100% !important;
        padding-left: 0px !important;
        padding-right: 0px !important;
      }

      .u-row .u-col {
        min-width: 320px !important;
        max-width: 100% !important;
        display: block !important;
      }

      .u-row {
        width: 100% !important;
      }

      .u-col {
        width: 100% !important;
      }

      .u-col>div {
        margin: 0 auto;
      }
    }

    body {
      margin: 0;
      padding: 0;
    }

    table,
    tr,
    td {
      vertical-align: top;
      border-collapse: collapse;
    }

    p {
      margin: 0;
    }

    .ie-container table,
    .mso-container table {
      table-layout: fixed;
    }

    * {
      line-height: inherit;
    }

    a[x-apple-data-detectors='true'] {
      color: inherit !important;
      text-decoration: none !important;
    }

    table,
    td {
      color: #000000;
    }

    #u_body a {
      color: #0000ee;
      text-decoration: underline;
    }
  </style>



  <!--[if !mso]><!-->
  <link href="https://fonts.googleapis.com/css?family=Montserrat:400,700" rel="stylesheet" type="text/css">
  <link href="https://fonts.googleapis.com/css?family=Cabin:400,700" rel="stylesheet" type="text/css">
  <!--<![endif]-->

</head>

<body class="clean-body u_body"
  style="margin: 0;padding: 0;-webkit-text-size-adjust: 100%;background-color: #e7e7e7;color: #000000">
  <!--[if IE]><div class="ie-container"><![endif]-->
  <!--[if mso]><div class="mso-container"><![endif]-->
  <table id="u_body"
    style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;min-width: 320px;Margin: 0 auto;background-color: #e7e7e7;width:100%"
    cellpadding="0" cellspacing="0">
    <tbody>
      <tr style="vertical-align: top">
        <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
          <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background-color: #e7e7e7;"><![endif]-->



          <div class="u-row-container" style="padding: 0px;background-color: #ffffff">
            <div class="u-row"
              style="margin: 0 auto;min-width: 320px;max-width: 500px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
              <div
                style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
                <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: #ffffff;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:500px;"><tr style="background-color: transparent;"><![endif]-->

                <!--[if (mso)|(IE)]><td align="center" width="500" style="width: 500px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                <div class="u-col u-col-100"
                  style="max-width: 320px;min-width: 500px;display: table-cell;vertical-align: top;">
                  <div style="height: 100%;width: 100% !important;">
                    <!--[if (!mso)&(!IE)]><!-->
                    <div
                      style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                      <!--<![endif]-->

                      <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0"
                        cellspacing="0" width="100%" border="0">
                        <tbody>
                          <tr>
                            <td
                              style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;"
                              align="left">

                              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                  <td style="padding-right: 0px;padding-left: 0px;" align="center">

                                    <img align="center" border="0"
                                      src="https://assets.unlayer.com/projects/175801/1691011225210-HHlogo2023.png"
                                      alt="" title=""
                                      style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: inline-block !important;border: none;height: auto;float: none;width: 19%;max-width: 91.2px;"
                                      width="91.2" />

                                  </td>
                                </tr>
                              </table>

                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <!--[if (!mso)&(!IE)]><!-->
                    </div>
                    <!--<![endif]-->
                  </div>
                </div>
                <!--[if (mso)|(IE)]></td><![endif]-->
                <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
              </div>
            </div>
          </div>





          <div class="u-row-container" style="padding: 0px;background-color: #ffffff">
            <div class="u-row"
              style="margin: 0 auto;min-width: 320px;max-width: 500px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #e63d3f;">
              <div
                style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
                <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: #ffffff;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:500px;"><tr style="background-color: #e63d3f;"><![endif]-->

                <!--[if (mso)|(IE)]><td align="center" width="500" style="background-color: #e63d3f;width: 500px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
                <div class="u-col u-col-100"
                  style="max-width: 320px;min-width: 500px;display: table-cell;vertical-align: top;">
                  <div
                    style="background-color: #e63d3f;height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                    <!--[if (!mso)&(!IE)]><!-->
                    <div
                      style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                      <!--<![endif]-->

                      <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0"
                        cellspacing="0" width="100%" border="0">
                        <tbody>
                          <tr>
                            <td
                              style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;"
                              align="left">

                              <h1
                                style="margin: 0px; color: #ffffff; line-height: 140%; text-align: center; word-wrap: break-word; font-family: 'Montserrat',sans-serif; font-size: 33px; font-weight: 700;">
                                HACK TO THE FUTURE!</h1>

                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0"
                        cellspacing="0" width="100%" border="0">
                        <tbody>
                          <tr>
                            <td
                              style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;"
                              align="left">

                              <div
                                style="font-family: 'Cabin',sans-serif; font-size: 25px; color: #b63030; line-height: 140%; text-align: center; word-wrap: break-word;">
                                <p style="line-height: 140%;"><span
                                    style="color: #ffffff; line-height: 35px;"><strong><span
                                        style="line-height: 35px;">October 20-22, 2023</span></strong>
                                  </span>
                                </p>
                              </div>

                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0"
                        cellspacing="0" width="100%" border="0">
                        <tbody>
                          <tr>
                            <td
                              style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;"
                              align="left">

                              <div
                                style="font-family: 'Montserrat',sans-serif; font-size: 14px; line-height: 140%; text-align: center; word-wrap: break-word;">
                                <p style="line-height: 140%;"><span style="color: #ecf0f1; line-height: 19.6px;">We're
                                    so glad you took the time to apply to HackHarvard 2023! Decisions will be released
                                    at the end of September, and we'll email you once they are available. You can also
                                    check the status of your application on our portal's <a target="_blank"
                                      href="https://portal.hackharvard.io/dashboard"
                                      rel="noopener">dashboard</a>.</span></p>
                                <p style="line-height: 140%;">&nbsp;</p>
                                <p style="line-height: 140%;"><span style="color: #ecf0f1; line-height: 19.6px;">In the
                                    meantime, follow us on <a target="_blank"
                                      href="https://instagram.com/hackharvardcollege" rel="noopener">Instagram</a> so
                                    you can stay up to date on all the exciting things we've planned for HackHarvard
                                    2023!</span></p>
                                <p style="line-height: 140%;">&nbsp;</p>
                                <p style="line-height: 140%;"><span style="color: #ecf0f1; line-height: 19.6px;">If you
                                    have any questions or concerns, visit our <a target="_blank"
                                      href="https://hackharvard.io/" rel="noopener">FAQs</a> or you can reach us at <a
                                      target="_blank" href="mailto:team@hackharvard.io"
                                      rel="noopener">team@hackharvard.io</a>.</span></p>
                                <p style="line-height: 140%;">&nbsp;</p>
                                <p style="line-height: 140%;"><span style="color: #ecf0f1; line-height: 19.6px;">With
                                    love 🤍,</span></p>
                                <p style="line-height: 140%;"><span style="color: #ecf0f1; line-height: 19.6px;">The
                                    HackHarvard Team</span></p>
                              </div>

                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0"
                        cellspacing="0" width="100%" border="0">
                        <tbody>
                          <tr>
                            <td
                              style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;"
                              align="left">

                              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                  <td style="padding-right: 0px; padding-left: 0px;" align="center">
                                    <a href="https://www.youtube.com/watch?v=Q-2PzbXm5-Q&t=1s" target="_blank">
                                      <img align="center" border="0"
                                        src="https://assets.unlayer.com/projects/175801/1691013406561-video_youtube_Q-2PzbXm5-Q.jpg"
                                        alt="Video" title="Video"
                                        style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: auto;float: none;width: 100%;max-width: 480px;"
                                        width="480" class="fullwidth" />
                                    </a>
                                  </td>
                                </tr>
                              </table>

                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <!--[if (!mso)&(!IE)]><!-->
                    </div>
                    <!--<![endif]-->
                  </div>
                </div>
                <!--[if (mso)|(IE)]></td><![endif]-->
                <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
              </div>
            </div>
          </div>



          <!--[if (mso)|(IE)]></td></tr></table><![endif]-->
        </td>
      </tr>
    </tbody>
  </table>
  <!--[if mso]></div><![endif]-->
  <!--[if IE]></div><![endif]-->
</body>

</html>
  `

  let disabled = true
  let showValidation = false
  let dbValues: ApplicationData
  let values: ApplicationData = {
    personal: {
      email: '',
      firstName: '',
      lastName: '',
      age: '',
      gender: '',
      race: [],
      underrepresented: false,
      phoneNumber: '',
      countryOfResidence: '',
      shippingAddress: '',
      shippingCity: '',
      shippingState: '',
      shippingCountry: '',
      shippingZipCode: '',
      dietaryRestrictions: [],
    },
    academic: {
      enrolled: false,
      currentSchool: '',
      graduationYear: '',
      major: '',
      affiliated: false,
      levelOfStudy: '',
    },
    hackathon: {
      shirtSize: '',
      firstHackathon: false,
      previouslyParticipated: false,
      ableToAttend: false,
      reason: '',
    },
    openResponse: {
      roles: [],
      otherRole: '',
      prolangs: [],
      otherProlang: '',
      experience: '',
      whyHh: '',
      project: '',
      predictions: '',
      resume: {
        url: '',
        name: '',
      },
      resumeShare: false,
    },
    agreements: {
      codeOfConduct: false,
      sharing: false,
      mlhEmails: false,
      submitting: false,
    },
    meta: {
      hhid: '',
      uid: '',
      submitted: false,
    },
    status: {
      accepted: false,
      rejected: false,
      waitlisted: false,
    },
    timestamps: {
      created: serverTimestamp(),
      updated: serverTimestamp(),
    },
  }
  let resumeFile: File
  let saveInterval: number | undefined = undefined
  onMount(() => {
    return user.subscribe((user) => {
      if (user) {
        getDoc(doc(db, 'applications', user.object.uid)).then(
          (applicationDoc) => {
            const applicationExists = applicationDoc.exists()
            if (applicationExists) {
              const applicationData = applicationDoc.data() as ApplicationData
              values = cloneDeep(applicationData)
              dbValues = cloneDeep(applicationData)
              if (
                !values.meta.submitted &&
                (values.personal.email !== user.object.email ||
                  values.personal.firstName !== user.profile.firstName ||
                  values.personal.lastName !== user.profile.lastName)
              ) {
                values.personal.email = user.object.email as string
                values.personal.firstName = user.profile.firstName
                values.personal.lastName = user.profile.lastName
                handleSave()
              }
            } else {
              values.meta.uid = user.object.uid
              values.meta.hhid = user.profile.hhid
              values.personal.email = user.object.email as string
              values.personal.firstName = user.profile.firstName
              values.personal.lastName = user.profile.lastName
              handleSave()
            }
            if (!values.meta.submitted) {
              disabled = false
              if (saveInterval === undefined) {
                saveInterval = window.setInterval(() => {
                  handleSave()
                }, 300000)
              }
            }
          },
        )
      }
    })
  })

  onDestroy(() => {
    clearInterval(saveInterval)
    saveInterval = undefined
  })
  function modifiedValues() {
    return {
      ...values,
      timestamps: {
        ...values.timestamps,
        updated: serverTimestamp(),
      },
    }
  }
  function handleSave(disable: boolean = false) {
    if (!disabled) {
      showValidation = false
      if (disable) {
        disabled = true
      }
      return new Promise<void>((resolve, reject) => {
        if ($user) {
          const frozenUser = $user
          setDoc(
            doc(db, 'applications', frozenUser.object.uid),
            modifiedValues(),
          )
            .then(() => {
              getDoc(doc(db, 'applications', frozenUser.object.uid)).then(
                (applicationDoc) => {
                  const applicationData =
                    applicationDoc.data() as ApplicationData
                  values = cloneDeep(applicationData)
                  dbValues = cloneDeep(applicationData)
                  if (disable) {
                    disabled = false
                  }
                  alert.trigger('success', 'Your application was saved.')
                  resolve()
                },
              )
            })
            .catch((err) => {
              if (disable) {
                disabled = false
              }
              console.log(err)
              alert.trigger('error', err.code, true)
              reject()
            })
        }
      })
    }
  }
  function uploadFile(file: File, filePath: string) {
    const fileRef = ref(storage, filePath)
    return new Promise((resolve, reject) =>
      uploadBytes(fileRef, file)
        .then(() => {
          getDownloadURL(fileRef).then((url) => {
            resolve(url)
          })
        })
        .catch(reject),
    )
  }
  function handleSubmit(e: CustomEvent<SubmitData>) {
    if ($user) {
      const frozenUser = $user
      if (e.detail.error === null) {
        showValidation = false
        disabled = true
        uploadFile(resumeFile, `resumes/${frozenUser.object.uid}.pdf`)
          .then((downloadURL) => {
            values.openResponse.resume = {
              url: downloadURL as string,
              name: resumeFile.name,
            }
            values.meta.submitted = true
            setDoc(
              doc(db, 'applications', frozenUser.object.uid),
              modifiedValues(),
            )
              .then(() => {
                alert.trigger('success', 'Your application has been submitted!')
                getDoc(doc(db, 'applications', frozenUser.object.uid)).then(
                  (applicationDoc) => {
                    const applicationData =
                      applicationDoc.data() as ApplicationData
                    clearInterval(saveInterval)
                    saveInterval = undefined
                    values = cloneDeep(applicationData)
                    dbValues = cloneDeep(applicationData)
                    window.scrollTo({
                      top: 0,
                      behavior: 'smooth',
                    })
                    handleEmail()
                  },
                )
              })
              .catch((err) => {
                disabled = false
                alert.trigger('error', err.code, true)
              })
          })
          .catch(() => {
            disabled = false
            alert.trigger('error', 'Error uploading resume. Please try again.')
          })
      } else {
        showValidation = true
        alert.trigger('error', e.detail.error)
      }
    }
  }
  function handleEmail() {
    return addDoc(collection(db, 'mail'), {
      to: [values.personal.email],
      message: {
        subject: 'HackHarvard Application Submitted!',
        html: applicationConfirmationEmail,
      },
    })
  }
  function handleUnload(e: BeforeUnloadEvent) {
    if (!isEqual(dbValues, values)) {
      e.preventDefault()
      e.returnValue = 'Save changes before leaving?'
      return 'Save changes before leaving?'
    }
  }
</script>

<svelte:window on:beforeunload={handleUnload} />
<Form
  class={clsx('max-w-2xl', showValidation && 'show-validation')}
  on:submit={handleSubmit}
>
  <fieldset class="space-y-14" {disabled}>
    <div class="grid gap-4">
      <span class="font-bold text-2xl">Personal</span>
      <Card class="space-y-3">
        <Field>
          {`Name: ${values.personal.firstName} ${values.personal.lastName}`}
        </Field>
        <Field>{`Email: ${values.personal.email}`}</Field>
        <div class="text-sm">
          {#if values.meta.submitted}
            The above name and email was the copy submitted on your application.
          {:else}
            Wrong name or email? Go to your <a class="link" href="/profile"
              >profile</a
            > to update your information. Once you submit, updates on your profile
            won't be reflected on your application.
          {/if}
        </div>
      </Card>
      {#if values.openResponse.resume.url !== ''}
        <a
          href={values.openResponse.resume.url}
          target="_blank"
          rel="noreferrer"
        >
          <Card class="flex items-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="h-5 w-5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
            <span>{`${values.openResponse.resume.name} (resume)`}</span>
          </Card>
        </a>
      {/if}
      <Input
        class="w-24"
        type="number"
        bind:value={values.personal.age}
        placeholder="How old will you be on October 20th, 2023?"
        min="0"
        max="100"
        required
      />
      <Select
        bind:value={values.personal.gender}
        placeholder="Gender"
        options={gendersJson}
        floating
        required
      />
      <div class="grid gap-1">
        <span>Race / ethnicity (check all that apply)</span>
        <div class="grid grid-cols-2">
          {#each raceJson as race}
            <Input
              type="checkbox"
              bind:value={values.personal.race}
              placeholder={race.name}
            />
          {/each}
        </div>
      </div>
      <Select
        bind:value={values.personal.underrepresented}
        placeholder="Do you identify as part of an underrepresented group in the technology industry?"
        options={[{ name: 'Yes' }, { name: 'No' }, { name: 'Unsure' }]}
        required
      />
      <Input
        type="tel"
        bind:value={values.personal.phoneNumber}
        placeholder="Phone number"
        floating
        required
        pattern="[\d\s\-\+]+"
      />
      <Select
        bind:value={values.personal.countryOfResidence}
        placeholder="Country of residence"
        options={worldJson}
        floating
        required
      />
      <Input
        type="text"
        bind:value={values.personal.shippingAddress}
        placeholder="Shipping Address"
        floating
        required
      />
      <div class="grid gap-1 sm:grid-cols-2 sm:gap-3">
        <Input
          type="text"
          bind:value={values.personal.shippingCity}
          placeholder="City"
          floating
          required
        />
        <Select
          bind:value={values.personal.shippingState}
          placeholder="State"
          options={statesJson}
          floating
          required
        />
      </div>
      <div class="grid gap-1 sm:grid-cols-2 sm:gap-3">
        <Select
          bind:value={values.personal.shippingCountry}
          placeholder="Country"
          options={worldJson}
          floating
          required
        />
        <Input
          type="text"
          bind:value={values.personal.shippingZipCode}
          placeholder="Zip code"
          floating
          required
        />
      </div>
      <div class="mt-2 grid gap-1">
        <span> Do you have any dietary restrictions?</span>
        <div class="grid grid-cols-2">
          {#each dietaryRestrictionsJson as dietaryRestriction}
            <Input
              type="checkbox"
              bind:value={values.personal.dietaryRestrictions}
              placeholder={dietaryRestriction.name}
            />
          {/each}
        </div>
      </div>
    </div>
    <div class="grid gap-4">
      <span class="font-bold text-2xl">Academic</span>
      <Select
        bind:value={values.academic.levelOfStudy}
        placeholder="What is your current education level?"
        options={levelOfStudyJson}
        floating
        required
      />
      <Input
        type="checkbox"
        bind:value={values.academic.enrolled}
        placeholder="Will you be pursuing an undergraduate degree program at a university on October 20th, 2023?"
        required
      />
      <div class="grid gap-1 sm:grid-cols-3 sm:gap-3">
        <div class="sm:col-span-2">
          <Select
            bind:value={values.academic.currentSchool}
            placeholder="Current school"
            options={schoolsJson}
            floating
            required
          />
        </div>
        <Input
          type="number"
          bind:value={values.academic.graduationYear}
          placeholder="Graduation year"
          min={new Date().getFullYear()}
          max={new Date().getFullYear() + 20}
          floating
          required
        />
      </div>
      <Select
        bind:value={values.academic.major}
        placeholder="Major / field of study"
        options={majorJson}
        floating
        required
      />
      <Input
        type="checkbox"
        bind:value={values.academic.affiliated}
        placeholder="Are you affiliated with Harvard University? If so, make sure
        your profile uses your Harvard email."
        validations={[
          [
            values.academic.affiliated &&
              !values.personal.email.includes('harvard'),
            'If you are affiliated, please go to your profile to change to a Harvard email.',
          ],
        ]}
      />
    </div>
    <div class="grid gap-4">
      <span class="font-bold text-2xl">Hackathon</span>
      <div class="grid grid-cols-2 sm:grid-cols-3">
        <Select
          bind:value={values.hackathon.shirtSize}
          placeholder="Shirt size"
          options={shirtSizeJson}
          floating
          required
        />
      </div>
      <Input
        type="checkbox"
        bind:value={values.hackathon.firstHackathon}
        placeholder="Will HackHarvard be your first hackathon?"
      />
      {#if !values.hackathon.firstHackathon}
        <Input
          type="checkbox"
          bind:value={values.hackathon.previouslyParticipated}
          placeholder="Have you previously participated at a HackHarvard hackathon?"
        />
      {/if}
      <Input
        type="checkbox"
        bind:value={values.hackathon.ableToAttend}
        placeholder="HackHarvard is an in-person event. Will you be able to be in Cambridge, MA, United States, considering both the legal requirements for international students and the logistical aspects, on October 20th, 2023?"
        required
      />
      <Select
        bind:value={values.hackathon.reason}
        placeholder="How did you learn about HackHarvard?"
        options={reasonsJson}
        required
      />
    </div>
    <div class="grid gap-4">
      <span class="font-bold text-2xl">Open Response</span>
      <div class="grid gap-1">
        <span>
          What roles best fit your capabilities on a hackathon team?<span
            class="text-red-500"
          >
            *
          </span>
        </span>
        <div class="grid grid-cols-2 gap-2">
          {#each rolesJson as role}
            <Input
              type="checkbox"
              bind:value={values.openResponse.roles}
              placeholder={role.name}
            />
          {/each}
        </div>
        {#if values.openResponse.roles.includes('other')}
          <Textarea
            bind:value={values.openResponse.otherRole}
            placeholder="If other, what other roles could you see yourself playing? (200 char limit)"
            required
            rows={1}
            maxlength={200}
          />
        {/if}
      </div>
      <div class="grid gap-1">
        <span>
          Check up to 5 of the programming languages that you feel most
          comfortable in.<span class="text-red-500"> * </span>
        </span>
        <div class="grid grid-cols-2 gap-2">
          {#each prolangsJson as prolang}
            <Input
              type="checkbox"
              bind:value={values.openResponse.prolangs}
              placeholder={prolang.name}
              validations={[
                [
                  values.openResponse.prolangs.length > 5,
                  'Check up to 5 programming languages only.',
                ],
              ]}
              required
            />
          {/each}
        </div>
        {#if values.openResponse.prolangs.includes('other')}
          <Textarea
            bind:value={values.openResponse.otherProlang}
            placeholder="If other, what other programming languages? (200 char limit)"
            required
            rows={1}
            maxlength={200}
          />
        {/if}
      </div>
      <Select
        bind:value={values.openResponse.experience}
        placeholder="How much experience do you have with computer science?"
        options={experienceJson}
        required
      />
      <Textarea
        bind:value={values.openResponse.whyHh}
        placeholder={`Share your goals and aspirations for this event and how you plan to make the most of your HackHarvard experience. What specific areas are you eager to learn more about, and what skills or technologies are you excited to acquire or improve? (500 char limit)`}
        required
        maxlength={500}
      />
      <Textarea
        bind:value={values.openResponse.project}
        placeholder={`HackHarvard is all about sparking creativity and making a positive difference through innovative projects. We'd love to hear about a project you've been part of that embodies this spirit. How did your project bring a touch of magic or create a lasting impact, whether big or small, on the people or community it reached? (500 char limit)`}
        required
        maxlength={500}
      />
      <Textarea
        bind:value={values.openResponse.predictions}
        placeholder={`In line with the theme "Hack to the Future" for HackHarvard 2023, we invite you to unleash your creativity and envision three predictions for the year 2073. Let your imagination soar as you consider how the world may have transformed. Did OpenAI create AGI? Is Taylor Swift’s granddaughter allergic to tree nuts? Does the iPhone 55 have a headphone jack? Are cat videos still funny? Share your captivating predictions with us! (500 char limit)`}
        required
        maxlength={500}
      />
      {#if values.openResponse.resume.url === ''}
        <div class="mt-2">
          <Input
            bind:value={resumeFile}
            type="file"
            placeholder="Upload your resume (max 1 MB; 1 page PDF)"
            maxSize={1 * 1024 * 1024}
            accept={['application/pdf']}
            required
          />
        </div>
      {/if}
      <Input
        type="checkbox"
        bind:value={values.openResponse.resumeShare}
        placeholder="If you are accepted to HackHarvard 2023, would you like us to share your resume with our sponsors for potential recruitment opportunities?"
      />
    </div>
    <div class="grid gap-4">
      <span class="font-bold text-2xl">Agreements</span>
      <Input
        type="checkbox"
        bind:value={values.agreements.codeOfConduct}
        placeholder="I have read and agree to the MLH Code of Conduct (https://static.mlh.io/docs/mlh-code-of-conduct.pdf)."
        required
      />
      <Input
        type="checkbox"
        bind:value={values.agreements.sharing}
        placeholder="I authorize you to share my application/registration information with Major League Hacking for event administration, ranking, and MLH administration in-line with the MLH Privacy Policy (https://mlh.io/privacy). I further agree to the terms of both the MLH Contest Terms and Conditions (https://github.com/MLH/mlh-policies/blob/main/contest-terms.md)and the MLH Privacy Policy (https://mlh.io/privacy)"
        required
      />
      <Input
        type="checkbox"
        bind:value={values.agreements.mlhEmails}
        placeholder="I authorize MLH to send me occasional emails about relevant events, career opportunities, and community announcements."
      />
      <Input
        type="checkbox"
        bind:value={values.agreements.submitting}
        placeholder="I understand submitting means I can no longer make changes to my application. Don't check this box until you are sure that you are ready to submit."
        required
      />
    </div>
    <div class={clsx('grid gap-3', !values.meta.submitted && 'grid-cols-2')}>
      {#if values.meta.submitted}
        <div
          class="rounded-md bg-green-100 px-4 py-2 text-center text-green-900 shadow-sm"
        >
          Application submitted and in review!
        </div>
      {:else}
        <button
          type="button"
          on:click={() => handleSave(true)}
          class="rounded-md bg-gray-100 px-4 py-2 shadow-sm transition-colors duration-300 hover:bg-gray-200 disabled:bg-gray-200 disabled:text-gray-500"
        >
          Save draft
        </button>
        <button
          type="submit"
          class="rounded-md bg-blue-100 px-4 py-2 text-blue-900 shadow-sm transition-colors duration-300 hover:bg-blue-200 disabled:bg-blue-200 disabled:text-blue-500"
        >
          Submit
        </button>
      {/if}
    </div>
  </fieldset>
</Form>
