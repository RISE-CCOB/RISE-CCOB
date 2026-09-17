import { useState, useEffect, useRef } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import format from 'date-fns/format'
import parse from 'date-fns/parse'
import startOfWeek from 'date-fns/startOfWeek'
import getDay from 'date-fns/getDay'
import enUS from 'date-fns/locale/en-US'

import 'react-big-calendar/lib/css/react-big-calendar.css'
import './App.css'

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const AUTH_URL = "https://script.google.com/macros/s/AKfycbw1zK76CVgbleKQJhx8pThAAG-4TRMn40ezMyWxUksvQdv1qX41xgoNty8n07Ch9rLw/exec"
const DB_URL = "https://us-west-2.data.tidbcloud.com/api/v1beta/app/dataapp-ZEsnjtEB/endpoint/"



function validateDate(date, useTime) {
  console.log(date)
  if (useTime) {
    if (date.length == 16) return date
    return '2000-01-01T00:00'
  } else {
    if (date.length == 10) return date
    return '2000-01-01'
  }
}

async function login(e, setTab, setLoadMessage, setKEY) {
  e.preventDefault();
  setTab(3)

  try {
    setLoadMessage("Logging in...")
    const data = new FormData(e.target)
    const values = Object.fromEntries(data.entries())
    const response = await fetch(AUTH_URL + "?password=" + values.password)
    const result = await response.text()
    setKEY(result)
  } catch (e) {}

  setTab(0)
}

async function getMemberData(setLoadMessage, KEY, setLoadingMembers, setMemberData) {
  try {
    setLoadingMembers(true)
    setLoadMessage("Fetching Members...")
    const response = await fetch(DB_URL + "getMembers", {headers: {"Authorization": "Basic " + KEY}})
    const result = await response.json()
    setMemberData(result.data.rows)
  } catch (e) {console.log(e)}
  
  setLoadingMembers(false)
}

async function updateMember(e, setTab, setLoadMessage, KEY, viewedMember, setMemberData) {
  e.preventDefault();
  setTab(3)

  try {
    setLoadMessage("Updating Member...")
    const data = new FormData(e.target)
    const values = Object.fromEntries(data.entries())
    values["id"] = viewedMember.m_id
    values.bday = validateDate(values.bday)
    const response = await fetch(DB_URL + "updateMember", {method: "POST", headers: {"Authorization": "Basic " + KEY, "Content-Type": "application/json"}, body: JSON.stringify(values)})
    const result = await response.json()
    setMemberData(result.data.rows)
  } catch (e) {}

  setTab(0)
}

async function createNewMember(e, setTab, setLoadMessage, KEY, setMemberData) {
  e.preventDefault();
  setTab(3)
  
  try {
    setLoadMessage("Creating Member...")
    const data = new FormData(e.target)
    const values = Object.fromEntries(data.entries())
    values.bday = validateDate(values.bday)
    const response = await fetch(DB_URL + "createMember", {method: "POST", headers: {"Authorization": "Basic " + KEY, "Content-Type": "application/json"}, body: JSON.stringify(values)})
    const result = await response.json()
    setMemberData(result.data.rows)
  } catch (e) {console.log("Error", e)}

  setTab(0)
}

async function updateEvent(e, setTab, setLoadMessage, KEY, setEventData, viewedEvent, attendanceData) {
  e.preventDefault();
  setTab(3)

  try {
    setLoadMessage("Updating Event...")
    const data = new FormData(e.target)
    let values = Object.fromEntries(data.entries())
    values["id"] = viewedEvent.e_id
    // Calculate attendance records to remove (In previous attendance, but not new attendance)
    let removeRecords = []
    for (let i of attendanceData) if (!Object.hasOwn(values, i)) removeRecords.push(Number(i))
    // Calculate attendance records to create (In new attendance, but not previous attendance)
    let createRecords = []
    for (let i of Object.keys(values)) if (!attendanceData.includes(i) && values[i] == 'on') createRecords.push(Number(i))
    // Simplify values object
    values = {
      id: values.id,
      title: values.title,
      event_date: validateDate(values.event_date, true),
      description: values.description,
      remove_ids: removeRecords.join(","),
      create_ids: createRecords.join(",")
    }
    const response = await fetch(DB_URL + "updateEvent", {method: "POST", headers: {"Authorization": "Basic " + KEY, "Content-Type": "application/json"}, body: JSON.stringify(values)})
    const result = await response.json()
    setEventData(result.data.rows)
  } catch (e) {console.log(e)}

  setTab(1)
}

async function createNewEvent(e, setTab, setLoadMessage, KEY, setEventData) {
  e.preventDefault();
  setTab(3)

  try {
    setLoadMessage("Creating Event...")
    const data = new FormData(e.target)
    const values = Object.fromEntries(data.entries())
    values.event_date = validateDate(values.event_date, true)
    const response = await fetch(DB_URL + "createEvent", {method: "POST", headers: {"Authorization": "Basic " + KEY, "Content-Type": "application/json"}, body: JSON.stringify(values)})
    const result = await response.json()
    setEventData(result.data.rows)
  } catch (e) {}

  setTab(1)
}

async function getEventData(setLoadingEvents, setLoadMessage, KEY, setEventData) {
  try {
    setLoadingEvents(true)
    setLoadMessage("Fetching Events...")
    const response = await fetch(DB_URL + "getEvents", {headers: {"Authorization": "Basic " + KEY}})
    const result = await response.json()
    setEventData(result.data.rows)
  } catch (e) {}

  setLoadingEvents(false)
}

async function getAttendanceData(setLoadingAttendance, setAttendanceData, KEY, viewedEvent, attendanceFetched) {
  try {
    setLoadingAttendance(true)
    const response = await fetch(DB_URL + "getAttendance?id=" + viewedEvent.e_id, {headers: {"Authorization": "Basic " + KEY}})
    const result = await response.json()
    let attendance = []
    for (let i of result.data.rows) attendance.push(i.m_id)
    setAttendanceData(attendance)
  } catch (e) {console.log(e)}

  setLoadingAttendance(false)
  attendanceFetched.current = viewedEvent.e_id
}

async function deleteMember(m_id, KEY, setMemberData, setTab, setLoadMessage) {
  setTab(3)
  setLoadMessage("Deleting...")
  try {
    const response = await fetch(DB_URL + "deleteMember", {method: "POST", headers: {"Authorization": "Basic " + KEY, "Content-Type": "application/json"}, body: JSON.stringify({"m_id": m_id})})
    const result = await response.json()
    setMemberData(result.data.rows)
  } catch (e) {}
  setTab(0)
}

async function deleteEvent(e_id, KEY, setEventData, setTab, setLoadMessage) {
  setTab(3)
  setLoadMessage("Deleting...")
  try {
    const response = await fetch(DB_URL + "deleteEvent", {method: "POST", headers: {"Authorization": "Basic " + KEY, "Content-Type": "application/json"}, body: JSON.stringify({"e_id": e_id})})
    const result = await response.json()
    setEventData(result.data.rows)
  } catch (e) {}
  setTab(1)
}



function TabButton({text, tabid, tab, setTab}) {
  if (tab == tabid) {
    return <button className="tabbutton" onClick={() => {if (tab != 3) setTab(tabid)}} style={{backgroundColor:"bisque"}}>{text}</button>
  }
  return <button className="tabbutton" onClick={() => {if (tab != 3) setTab(tabid)}}>{text}</button>
}

function FilterButton({text, highlight, onClick}) {
  if (highlight) {
    return <button className="filterbutton" onClick={onClick} style={{backgroundColor:"bisque"}}>{text}</button>
  }
  return <button className="filterbutton" onClick={onClick}>{text}</button>
}

function MemberCard({member, onClick}) {
  return (
  <button className="membercard" onClick={onClick}>
    <p style={{flexGrow:1, textAlign:'left'}}>{member.fname} {member.lname}</p>
    <div>
      <p>{member.phone}</p>
      <p>{member.email}</p>
    </div>
  </button>)
}

function EventCard({event, setViewedEvent, setTab}) {
  const event_date = new Date(event.event_date)

  return (
  <button style={{display:'flex',flexDirection:'column'}} className="membercard" onClick={() => {setViewedEvent(event); setTab(6)}}>
    <p style={{flexGrow:1, textAlign:'left'}}>{event.title}</p>
    <p style={{flexGrow:1, textAlign:'left'}}>{event_date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })}</p>
  </button>)
}

function AttendanceFilter({memberData, attendanceData}) {
  const [attendanceFilter, setAttendanceFilter] = useState("")

  let view = [
    <div key='div' style={{width:'100%', backgroundColor:'white', padding:'16px 0'}}>
      <label style={{margin:'0 16px'}}>Filter</label>
      <input type="text" onChange={(e) => {setAttendanceFilter(e.target.value)}}></input>
    </div>
  ]

  // Build form elements
  for (let m of memberData) {
    let display = 'none'
    if (attendanceFilter == '') display = 'flex'
    else {
      if (m.fname.toLowerCase().includes(attendanceFilter.toLowerCase())) display = 'flex'
      else if (m.lname.toLowerCase().includes(attendanceFilter.toLowerCase())) display = 'flex'
    }
    view.push(<div key={m.m_id + "_div"} className='attendanceCard' style={{display:display}}>
      <label style={{flexGrow:'1', textAlign:'left', margin:'12px'}} htmlFor={m.m_id}>{m.fname} {m.lname}</label>
      <input style={{flexGrow:'0', width:'32px', height:'32px', margin:'12px'}} id={m.m_id} name={m.m_id} type="checkbox" defaultChecked={attendanceData.includes(m.m_id)}></input>
    </div>)
  }

  return <div style={{display:'flex', flexDirection:'column', backgroundColor:'antiquewhite', width:'100%'}}>{view}</div>
}

function Attendance({membersFetched, getMemberData, viewedEvent, attendanceFetched, getAttendanceData, memberData, attendanceData, setAttendanceData, KEY}) {
  const [loadingAttendance, setLoadingAttendance] = useState(false)
  
  let view = [<h3 key='0'>Attendance</h3>]

  useEffect(() => {
    if (!membersFetched.current) {
      // Make sure members have been fetched
      membersFetched.current = true
      getMemberData()
      view.push(<p key='1'>Fetching Members...</p>)
      return
    } else if (attendanceFetched.current != viewedEvent.e_id && !loadingAttendance) {
      // Make sure attendance records for this event are fetched
      getAttendanceData(setLoadingAttendance, setAttendanceData, KEY, viewedEvent, attendanceFetched)
      view.push(<p key='1'>Fetching Attendance...</p>)
      return
    }
  })

  if (attendanceFetched.current == viewedEvent.e_id) view.push(<AttendanceFilter key='attendanceFilter' memberData={memberData} attendanceData={attendanceData} />)

  return view
}

function CalendarCard({event}) {
  const timeString = event.start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return <div style={{display: 'flex', flexDirection: 'column'}} onClick={(e) => {
    e.stopPropagation()
    event.setViewedEvent(event.rawDetails)
    event.setTab(6)
  }}>
    <h4 style={{margin: 0, fontSize: '10pt'}}>{event.title}</h4>
    <p style={{color: 'white', margin: 0, fontSize: '8pt'}}>{timeString}</p>
  </div>
}

function EventCalendar({eventData, setViewedEvent, setTab}) {
  const calendarEvents = eventData.map(event => {
    const startDate = new Date(event.event_date);
    const ONE_HOUR_IN_MS = 60 * 60 * 1000;
    const endDate = new Date(startDate.getTime() + ONE_HOUR_IN_MS);
    
    return {
      id: event.e_id,
      title: event.title,
      start: startDate,
      end: endDate,
      setViewedEvent: setViewedEvent,
      setTab: setTab,
      rawDetails: event
  }})

  return <Calendar localizer={localizer} events={calendarEvents} startAccessor={'start'} endAccessor={'end'} defaultView='month' views={['month']} components={{event: CalendarCard}} style={{width: '80%', aspectRatio: '7/5'}} popup={true} />
}



// Login view
function Login({setTab, setLoadMessage, setKEY}) {
  return <>
    <form onSubmit={(e) => login(e, setTab, setLoadMessage, setKEY)}>
      <h3>Enter Password</h3>
      <div>
        <label htmlFor='password'>Password</label>
        <input type="password" name="password" id="password"></input>
      </div>
      <br />
      <input type="submit" value="Login"></input>
      <br />
    </form>
  </>
}

// Members view
function Members({membersFetched, getMemberData, loadingMembers, memberData, setTab, setViewedMember, setLoadMessage, setLoadingMembers, setMemberData, KEY}) {
  const [membersFilter, setMembersFilter] = useState(0)

  useEffect(() => {
    if (!membersFetched.current) {
      membersFetched.current = true
      getMemberData(setLoadMessage, KEY, setLoadingMembers, setMemberData)
      return
    }
  })

  let view = [
  <div key='0' style={{display:'flex', width:'100%', marginBottom:'16px'}}>
    <button onClick={() => setTab(4)} className='filterbutton' style={{backgroundColor: 'bisque', boxShadow: '0 0 3px'}}>Add Member</button>
    <p style={{flexGrow:1}}></p>
    <div>
      Filter:
      <FilterButton text="Firstname" highlight={membersFilter == 0} onClick={() => {setMembersFilter(0)}} />
      <FilterButton text="Lastname" highlight={membersFilter == 1} onClick={() => {setMembersFilter(1)}} />
    </div>
  </div>
  ]

  if (loadingMembers) {
    return <p style={{flexGrow: 1}}>Loading...</p>
  } else if (memberData == "[]" || memberData == "" || memberData == "[[\"\"]]") {
    view.push("Nothing to see here!")
  } else {
    if (membersFilter == "0") {
      // sort by first name
      for (let i = 0; i < memberData.length-1; i++) {
        for (let j = i+1; j < memberData.length; j++) {
          if (memberData[j].fname < memberData[i].fname) {
            let temp = memberData[j]
            memberData[j] = memberData[i]
            memberData[i] = temp
          }
        }
      }
    } else {
      // sort by last name
      for (let i = 0; i < memberData.length-1; i++) {
        for (let j = i+1; j < memberData.length; j++) {
          if (memberData[j].lname < memberData[i].lname) {
            let temp = memberData[j]
            memberData[j] = memberData[i]
            memberData[i] = temp
          }
        }
      }
    }

    for (let row of memberData) {
      view.push(<MemberCard member={row} key={row.m_id} onClick={() => {setViewedMember(row); setTab(2)}} />)
    }
  }

  return view
}

// Events view 
function Events({getEventData, eventData, setTab, setViewedEvent, setLoadMessage, setEventData, KEY, eventsFetched}) {
  const [loadingEvents, setLoadingEvents] = useState(false)
  
  useEffect(() => {
    if (!eventsFetched.current) {
      eventsFetched.current = true
      getEventData(setLoadingEvents, setLoadMessage, KEY, setEventData)
      return
    }
  })

  let view = [
  <div key='0' style={{display:'flex', width:'100%', marginBottom:'16px'}}>
    <button onClick={() => setTab(5)} className='filterbutton' style={{backgroundColor:'bisque', boxShadow:'0 0 3px'}}>Add Event</button>
    <p style={{flexGrow:1}}></p>
  </div>,
  <EventCalendar key='calendar' eventData={eventData} setViewedEvent={setViewedEvent} setTab={setTab} />
  ]

  if (loadingEvents) {
    return <p style={{flexGrow: 1}}>Loading...</p>
  } else if (eventData == "[]" || eventData == "" || eventData == "[[\"\"]]") {
    view.push("Nothing to see here!")
  } else {
    // Sort event data by date
    for (let i = 0; i < eventData.length-1; i++) {
      for (let j = i+1; j < eventData.length; j++) {
        if (eventData[i].event_date < eventData[j].event_date) {
          const temp = eventData[i]
          eventData[i] = eventData[j]
          eventData[j] = temp
        }
      }
    }

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(today.getDate()).padStart(2, '0');
    const current_date = year + "-" + month + "-" + day

    // Coming events
    view.push(<h3 key='h1'>Upcoming Events</h3>)
    for (let i = eventData.length-1; i >= 0; i--) {
      const row = eventData[i]
      if (row.event_date.slice(0, 10) >= current_date) {
        view.push(<EventCard event={row} key={row.e_id} setViewedEvent={setViewedEvent} setTab={setTab} />)
      }
    }

    // Past events
    view.push(<h3 key='h2'>Past Events</h3>)
    for (let row of eventData) {
      if (row.event_date.slice(0, 10) < current_date) {
        view.push(<EventCard event={row} key={row.e_id} setViewedEvent={setViewedEvent} setTab={setTab} />)
      }
    }
  }

  view.push(<br key='spacer' />)

  return view
}

// Edit Member view
function EditMember({updateMember, viewedMember, setTab, setLoadMessage, KEY, setMemberData}) {
  return <>
    <form onSubmit={(e) => updateMember(e, setTab, setLoadMessage, KEY, viewedMember, setMemberData)}>
      <h3>Student Information</h3>
      <div>
        <label htmlFor="fname">First Name</label>
        <input type="text" name="fname" id="fname" defaultValue={viewedMember.fname} maxLength={255}></input>
      </div>
      <div>
        <label htmlFor="lname">Last Name</label>
        <input type="text" name="lname" id="lname" defaultValue={viewedMember.lname} maxLength={255}></input>
      </div>
      <div>
        <label htmlFor="bday">Birth Date</label>
        <input type="date" name="bday" id="bday" defaultValue={viewedMember.bday}></input>
      </div>
      <h3>Parent Information</h3>
      <div>
        <label htmlFor="parent">Full Name</label>
        <input type="text" name="parent" id="parent" defaultValue={viewedMember.parent} maxLength={255}></input>
      </div>
      <div>
        <label htmlFor="phone">Phone #</label>
        <input type="text" name="phone" id="phone" defaultValue={viewedMember.phone} maxLength={16}></input>
      </div>
      <div>
        <label htmlFor="email">Email</label>
        <input type="text" name="email" id="email" defaultValue={viewedMember.email} maxLength={255}></input>
      </div>
      <div>
        <label htmlFor="relationship">Relationship to Student</label>
        <input type="text" name="relationship" id="relationship" defaultValue={viewedMember.relationship} maxLength={255}></input>
      </div>
      <h3>Other Information</h3>
      <div>
        <label htmlFor="allergy">Allergy, Medical Information</label>
        <textarea rows={6} name="allergy" id="allergy" defaultValue={viewedMember.allergy} maxLength={4096}></textarea>
      </div>
      <br />
      <p>Transportation Permission</p>
      <div>
        <input type="radio" className='radio' name="trans" id="transyes" value={1} defaultChecked={viewedMember.trans == 1} />
        <label htmlFor="transyes" style={{width:'auto', flexGrow:'1'}}>✅ Yes, I give permission for my student to ride in approved transportation for RISE Youth activities.</label>
      </div>
      <div>
        <input type="radio" className='radio' name="trans" id="transno" value={0} defaultChecked={viewedMember.trans == 0} />
        <label htmlFor="transno" style={{width:'auto', flexGrow:'1'}}>❌ No, I do not give permission.</label>
      </div>
      <br />
      <p>Media Permission</p>
      <div>
        <input type="radio" className='radio' name="media" id="mediayes" value={1} defaultChecked={viewedMember.media == 1} />
        <label htmlFor="mediayes" style={{width:'auto', flexGrow:'1'}}>📸 Yes, I give permission for my student to appear in media by RISE Youth and the church.</label>
      </div>
      <div>
        <input type="radio" className='radio' name="media" id="mediano" value={0} defaultChecked={viewedMember.media == 0} />
        <label htmlFor="mediano" style={{width:'auto', flexGrow:'1'}}>🚫 No, please do not use photos or videos of my student.</label>
      </div>
      <br />
      <input type="submit" value="Update"></input>
      <div style={{justifyContent: 'right'}}>
        <button onClick={(e) => {
          e.preventDefault()
          if (confirm("Are you sure you want to delete this member? This CANNOT be undone!")) deleteMember(viewedMember.m_id, KEY, setMemberData, setTab, setLoadMessage)
        }} className='filterbutton' style={{backgroundColor: 'red', boxShadow: '0 0 3px'}}>Delete Member</button>
      </div>
      <br />
    </form>
  </>
}

// New Member view
function NewMember({createNewMember, setTab, setLoadMessage, KEY, setMemberData}) {
  return <>
    <form onSubmit={(e) => createNewMember(e, setTab, setLoadMessage, KEY, setMemberData)}>
      <p>Welcome to RISE Youth! 🙌 We’re excited for another year of growing in faith, building friendships, serving others, and having a whole lot of fun along the way.</p>
      <p>This form helps us keep our student and parent information up to date and make sure we have the necessary permissions for youth group activities, transportation, photos/videos, and off-site events.</p>
      <p>Please take a few minutes to complete the form for each student in your family. Your information will help our leaders care for your student well and keep everyone connected and informed.</p>
      <p>Thanks for partnering with us as we RISE together! ✝️🔥</p>
      <h3>Student Information</h3>
      <div>
        <label htmlFor="fname">First Name</label>
        <input type="text" name="fname" id="fname" maxLength={255}></input>
      </div>
      <div>
        <label htmlFor="lname">Last Name</label>
        <input type="text" name="lname" id="lname" maxLength={255}></input>
      </div>
      <div>
        <label htmlFor="bday">Birth Date</label>
        <input type="date" name="bday" id="bday"></input>
      </div>
      <h3>Parent Information</h3>
      <div>
        <label htmlFor="parent">Full Name</label>
        <input type="text" name="parent" id="parent" maxLength={255}></input>
      </div>
      <div>
        <label htmlFor="phone">Phone #</label>
        <input type="text" name="phone" id="phone" maxLength={16}></input>
      </div>
      <div>
        <label htmlFor="email">Email</label>
        <input type="text" name="email" id="email" maxLength={255}></input>
      </div>
      <div>
        <label htmlFor="relationship">Relationship to Student</label>
        <input type="text" name="relationship" id="relationship" maxLength={255}></input>
      </div>
      <h3>Other Information</h3>
      <p>Please let us know about any allergies, dietary restrictions, medical conditions, medications, or other important information our youth leaders should be aware of to help keep your student safe and cared for during RISE Youth activities and events.</p>
      <div>
        <label htmlFor="allergy">Allergy, Medical Information</label>
        <textarea rows={6} name="allergy" id="allergy" maxLength={4096}></textarea>
      </div>
      <br />
      <p>Throughout the year, RISE Youth may attend activities, events, service projects, retreats, and other fun opportunities away from the church. By giving permission below, you are allowing your student to ride in church-approved vehicles or with approved adult drivers when transportation is needed for a youth group activity. We’ll always communicate event details and transportation plans with parents ahead of time.</p>
      <div>
        <input type="radio" className='radio' name="trans" id="transyes" value={1} />
        <label htmlFor="transyes" style={{width:'auto', flexGrow:'1'}}>✅ Yes, I give permission for my student to ride in approved transportation for RISE Youth activities.</label>
      </div>
      <div>
        <input type="radio" className='radio' name="trans" id="transno" value={0} defaultChecked={true} />
        <label htmlFor="transno" style={{width:'auto', flexGrow:'1'}}>❌ No, I do not give permission.</label>
      </div>
      <br />
      <p>RISE Youth loves capturing the fun, friendships, service, and moments God is doing in the lives of our students! With your permission, photos and videos of your student may be used in church or youth ministry communications, including our Instagram, social media, promotional materials, slides, and videos. We’ll always aim to represent our students and ministry in a positive and respectful way.</p>
      <div>
        <input type="radio" className='radio' name="media" id="mediayes" value={1} />
        <label htmlFor="mediayes" style={{width:'auto', flexGrow:'1'}}>📸 Yes, I give permission for my student to appear in media by RISE Youth and the church.</label>
      </div>
      <div>
        <input type="radio" className='radio' name="media" id="mediano" value={0} defaultChecked={true} />
        <label htmlFor="mediano" style={{width:'auto', flexGrow:'1'}}>🚫 No, please do not use photos or videos of my student.</label>
      </div>
      <br />
      <input type="submit" value="Submit"></input>
      <br />
    </form>
  </>
}

// New Event view !!!
function NewEvent({setTab, setLoadMessage, KEY, setEventData}) {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(today.getDate()).padStart(2, '0');

  return <>
    <form onSubmit={(e) => createNewEvent(e, setTab, setLoadMessage, KEY, setEventData)}>
      <div>
        <label htmlFor="title">Event Title</label>
        <input type="text" name="title" id="title" defaultValue="Youth Group"></input>
      </div>
      <div>
        <label htmlFor="date">Event Date</label>
        <input type="datetime-local" name="event_date" id="date" defaultValue={year + "-" + month + "-" + day + "T17:30"}></input>
      </div>
      <div>
        <label htmlFor="description">Event Details</label>
        <textarea rows={6} name="description" id="description" maxLength={4096}></textarea>
      </div>
      <br />
      <p>*Create, then edit to add attendance</p>
      <input type="submit" value="Submit"></input>
      <br />
    </form>
  </>
}

// Edit Event view
function EditEvent({updateEvent, viewedEvent, setTab, setLoadMessage, KEY, setEventData, attendanceFetched, memberData, membersFetched}) {
  const [attendanceData, setAttendanceData] = useState([])

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(today.getDate()).padStart(2, '0');

  return <>
    <form onSubmit={(e) => updateEvent(e, setTab, setLoadMessage, KEY, setEventData, viewedEvent, attendanceData)}>
      <div>
        <label htmlFor="title">Event Title</label>
        <input type="text" name="title" id="title" defaultValue={viewedEvent.title}></input>
      </div>
      <div>
        <label htmlFor="date">Event Date</label>
        <input type="datetime-local" name="event_date" id="date" defaultValue={viewedEvent.event_date}></input>
      </div>
      <div>
        <label htmlFor="description">Event Details</label>
        <textarea rows={6} name="description" id="description" maxLength={4096} defaultValue={viewedEvent.description}></textarea>
      </div>
      <Attendance setAttendanceData={setAttendanceData} KEY={KEY} membersFetched={membersFetched} getMemberData={getMemberData} viewedEvent={viewedEvent} attendanceFetched={attendanceFetched} getAttendanceData={getAttendanceData} memberData={memberData} attendanceData={attendanceData} attendanceFetched={attendanceFetched} />
      <br />
      <input type="submit" value="Update"></input>
      <div style={{justifyContent: 'right'}}>
        <button onClick={(e) => {
          e.preventDefault()
          if (confirm("Are you sure you want to delete this event? This CANNOT be undone!")) deleteEvent(viewedEvent.e_id, KEY, setEventData, setTab, setLoadMessage)
        }} className='filterbutton' style={{backgroundColor: 'red', boxShadow: '0 0 3px'}}>Delete Event</button>
      </div>
      <br />
    </form>
  </>
}

function MainContent({tab, setTab}) {
  const [loadMessage, setLoadMessage] = useState("Loading...")
  const [KEY, setKEY] = useState(0)

  const [memberData, setMemberData] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [viewedMember, setViewedMember] = useState([])
  const membersFetched = useRef(false)

  const [eventData, setEventData] = useState([])
  const [viewedEvent, setViewedEvent] = useState([])
  const eventsFetched = useRef(false)

  const attendanceFetched = useRef(0)

  if (tab == 3) return <section className="maincontent"><h2>{loadMessage}</h2></section>

  if (KEY.length != 60) {
    return (
      <section className="maincontent">
        <h2>Login</h2>
        <Login setTab={setTab} setLoadMessage={setLoadMessage} setKEY={setKEY} />
      </section>
    )
  }

  switch (tab) {
    case 0:
      attendanceFetched.current = 0
      return (
        <section className="maincontent">
          <h2>Members</h2>
          <Members KEY={KEY} setLoadMessage={setLoadMessage} setLoadingMembers={setLoadingMembers} setMemberData={setMemberData} membersFetched={membersFetched} getMemberData={getMemberData} loadingMembers={loadingMembers} memberData={memberData} setTab={setTab} setViewedMember={setViewedMember} />
        </section>
      )
    case 1:
      attendanceFetched.current = 0
      return (
        <section className="maincontent">
          <h2>Events</h2>
          <Events eventsFetched={eventsFetched} KEY={KEY} setLoadMessage={setLoadMessage} setEventData={setEventData} getEventData={getEventData} eventData={eventData} setTab={setTab} setViewedEvent={setViewedEvent} />
        </section>
      )
    case 2:
      return (
        <section className="maincontent">
          <h2>Edit Member</h2>
          <EditMember updateMember={updateMember} setTab={setTab} setLoadMessage={setLoadMessage} KEY={KEY} viewedMember={viewedMember} setMemberData={setMemberData} />
        </section>
      )
    case 4:
      return (
        <section className="maincontent">
          <h2>New Member</h2>
          <NewMember createNewMember={createNewMember} setTab={setTab} setLoadMessage={setLoadMessage} KEY={KEY} setMemberData={setMemberData} />
        </section>
      )
    case 5:
      return (
        <section className="maincontent">
          <h2>New Event</h2>
          <NewEvent setTab={setTab} setLoadMessage={setLoadMessage} KEY={KEY} setEventData={setEventData} />
        </section>
      )
    case 6:
      return (
        <section className="maincontent">
          <h2>Edit Event</h2>
          <EditEvent memberData={memberData} membersFetched={membersFetched} updateEvent={updateEvent} viewedEvent={viewedEvent} setTab={setTab} setLoadMessage={setLoadMessage} KEY={KEY} setEventData={setEventData} attendanceFetched={attendanceFetched} />
        </section>
      )
  }
}

export default function App() {
  const [tab, setTab] = useState(0)

  return (
    <>
      <section id="center">
        <div id="titlebar">
          <h1>RISE</h1>
        </div>
        <MainContent tab={tab} setTab={setTab} />
        <nav id="footermenu">
          <ul id="footertabs">
            <li>
              <TabButton text="Members" tabid={0} tab={tab} setTab={setTab} />
            </li>
            <li>
              <TabButton text="Events" tabid={1} tab={tab} setTab={setTab} />
            </li>
          </ul>
        </nav>
      </section>
    </>
  )
}