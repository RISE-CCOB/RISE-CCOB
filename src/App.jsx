import { useState, useEffect, useRef } from 'react'
import './App.css'

export default function App() {
  const AUTH_URL = "https://script.google.com/macros/s/AKfycbw1zK76CVgbleKQJhx8pThAAG-4TRMn40ezMyWxUksvQdv1qX41xgoNty8n07Ch9rLw/exec"
  const DB_URL = "https://us-west-2.data.tidbcloud.com/api/v1beta/app/dataapp-ZEsnjtEB/endpoint/"

  const [tab, setTab] = useState(0)
  const [loadMessage, setLoadMessage] = useState("Loading...")
  const [KEY, setKEY] = useState(0)

  const [memberData, setMemberData] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [membersFilter, setMembersFilter] = useState(0)
  const [viewedMember, setViewedMember] = useState([])
  const membersFetched = useRef(false)

  const [eventData, setEventData] = useState([])
  const [loadingEvents, setLoadingEvents] = useState(false)
  const eventsFetched = useRef(false)

  const [attendanceData, setAttendanceData] = useState([])
  const [loadingAttendance, setLoadingAttendance] = useState(false)
  const attendanceFetched = useRef(false)
  


  async function login(e) {
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

  async function getMemberData() {
    try {
      setLoadingMembers(true)
      setLoadMessage("Fetching Members...")
      const response = await fetch(DB_URL + "getMembers", {headers: {"Authorization": "Basic " + KEY}})
      const result = await response.json()
      setMemberData(result.data.rows)
    } catch (e) {}
    
    setLoadingMembers(false)
  }
  
  async function updateMember(e) {
    e.preventDefault();
    setTab(3)

    try {
      setLoadMessage("Updating Member...")
      const data = new FormData(e.target)
      const values = Object.fromEntries(data.entries())
      values["id"] = viewedMember.m_id
      const response = await fetch(DB_URL + "updateMember", {method: "POST", headers: {"Authorization": "Basic " + KEY, "Content-Type": "application/json"}, body: JSON.stringify(values)})
      const result = await response.json()
      setMemberData(result.data.rows)
    } catch (e) {}

    setTab(0)
  }

  async function createNewMember(e) {
    e.preventDefault();
    setTab(3)

    try {
      setLoadMessage("Creating Member...")
      const data = new FormData(e.target)
      const values = Object.fromEntries(data.entries())
      const response = await fetch(DB_URL + "createMember", {method: "POST", headers: {"Authorization": "Basic " + KEY, "Content-Type": "application/json"}, body: JSON.stringify(values)})
      const result = await response.json()
      setMemberData(result.data.rows)
    } catch (e) {}

    setTab(0)
  }

  async function getEventData() {
    try {
      setLoadingEvents(true)
      setLoadMessage("Fetching Events...")
      const response = await fetch(URL + "?action=getEvents")
      const result = await response.json()
      setEventData(result)
    } catch (e) {}

    setLoadingEvents(false)
  }

  async function getAttendanceData() {
    try {
      setLoadingAttendance(true)
      setLoadMessage("Fetching Attendance...")
      const response = await fetch(URL + "?action=getAttendance")
      const result = await response.json()
      setAttendanceData(result)
    } catch (e) {}

    setLoadingAttendance(false)
  }

  function TabButton({text, tabid}) {
    if (tab == tabid) {
      return <button className="tabbutton" onClick={() => {if (tab != 3) setTab(tabid)}} style={{backgroundColor:"bisque"}}>{text}</button>
    }
    return <button className="tabbutton" onClick={() => {if (tab != 3) setTab(tabid)}}>{text}</button>
  }

  function FilterButton({text, filterid}) {
    if (membersFilter == filterid) {
      return <button className="filterbutton" onClick={() => {setMembersFilter(filterid)}} style={{backgroundColor:"bisque"}}>{text}</button>
    }
    return <button className="filterbutton" onClick={() => {setMembersFilter(filterid)}}>{text}</button>
  }

  function MemberCard({member}) {
    return (
    <button className="membercard" onClick={() => {setViewedMember(member); setTab(2)}}>
      <p style={{flexGrow:1, textAlign:'left'}}>{member.fname} {member.lname}</p>
      <div>
        <p>{member.phone}</p>
        <p>{member.email}</p>
      </div>
    </button>)
  }

  // Login view
  function Login({}) {
    return <>
      <form onSubmit={(e) => login(e)}>
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
  function Members({}) {
    useEffect(() => {
      if (!membersFetched.current) {
        membersFetched.current = true
        getMemberData()
        return
      }
    })

    if (loadingMembers) {
      return <p style={{flexGrow: 1}}>Loading...</p>
    } else if (memberData == "[]" || memberData == "" || memberData == "[[\"\"]]") {
      return "Nothing to see here!"
    }

    let view = [
    <div key='0' style={{display:'flex', width:'100%', marginBottom:'16px'}}>
      <button onClick={() => setTab(4)} style={{border:'none', padding:'20px', backgroundColor:'#ffe0e0', borderRadius:'16px', marginLeft:'16px'}}>+</button>
      <p style={{flexGrow:1}}></p>
      <div>
        Filter:
        <FilterButton text="Firstname" filterid="0" />
        <FilterButton text="Lastname" filterid="1" />
      </div>
    </div>
    ]

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
      view.push(<MemberCard member={row} key={row.m_id} />)
    }

    return view
  }

  // Events view
  function Events({}) {
    useEffect(() => {
      if (!eventsFetched.current) {
        eventsFetched.current = true
        getEventData()
        return
      }
    })

    if (loadingEvents) {
      return <p style={{flexGrow: 1}}>Loading...</p>
    } else if (eventData == "[]" || eventData == "" || eventData == "[[\"\"]]") {
      return "Nothing to see here!"
    }

    return eventData
  }

  // Edit Member view
  function EditMember({}) {
    return <>
      <form onSubmit={(e) => updateMember(e)}>
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
          <textarea type="text" rows={6} name="allergy" id="allergy" defaultValue={viewedMember.allergy} maxLength={4096}></textarea>
        </div>
        <br />
        <p>Transportation Permission</p>
        <div style={{placeItems:'left'}}>
          <input type="radio" className='radio' name="trans" id="transyes" value={1} defaultChecked={viewedMember.trans == 1} />
          <label htmlFor="transyes" style={{width:'auto', flexGrow:'1'}}>✅ Yes, I give permission for my student to ride in approved transportation for RISE Youth activities.</label>
        </div>
        <div style={{placeItems:'left'}}>
          <input type="radio" className='radio' name="trans" id="transno" value={0} defaultChecked={viewedMember.trans == 0} />
          <label htmlFor="transno" style={{width:'auto', flexGrow:'1'}}>❌ No, I do not give permission.</label>
        </div>
        <br />
        <p>Media Permission</p>
        <div style={{placeItems:'left'}}>
          <input type="radio" className='radio' name="media" id="mediayes" value={1} defaultChecked={viewedMember.media == 1} />
          <label htmlFor="mediayes" style={{width:'auto', flexGrow:'1'}}>📸 Yes, I give permission for my student to appear in media by RISE Youth and the church.</label>
        </div>
        <div style={{placeItems:'left'}}>
          <input type="radio" className='radio' name="media" id="mediano" value={0} defaultChecked={viewedMember.media == 0} />
          <label htmlFor="mediano" style={{width:'auto', flexGrow:'1'}}>🚫 No, please do not use photos or videos of my student.</label>
        </div>
        <br />
        <input type="submit" value="Update"></input>
        <br />
      </form>
    </>
  }

  // New Member view
  function NewMember({}) {
    return <>
      <form onSubmit={(e) => createNewMember(e)}>
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
          <textarea type="text" rows={6} name="allergy" id="allergy" maxLength={4096}></textarea>
        </div>
        <br />
        <p>Throughout the year, RISE Youth may attend activities, events, service projects, retreats, and other fun opportunities away from the church. By giving permission below, you are allowing your student to ride in church-approved vehicles or with approved adult drivers when transportation is needed for a youth group activity. We’ll always communicate event details and transportation plans with parents ahead of time.</p>
        <div style={{placeItems:'left'}}>
          <input type="radio" className='radio' name="trans" id="transyes" value={1} />
          <label htmlFor="transyes" style={{width:'auto', flexGrow:'1'}}>✅ Yes, I give permission for my student to ride in approved transportation for RISE Youth activities.</label>
        </div>
        <div style={{placeItems:'left'}}>
          <input type="radio" className='radio' name="trans" id="transno" value={0} />
          <label htmlFor="transno" style={{width:'auto', flexGrow:'1'}}>❌ No, I do not give permission.</label>
        </div>
        <br />
        <p>RISE Youth loves capturing the fun, friendships, service, and moments God is doing in the lives of our students! With your permission, photos and videos of your student may be used in church or youth ministry communications, including our Instagram, social media, promotional materials, slides, and videos. We’ll always aim to represent our students and ministry in a positive and respectful way.</p>
        <div style={{placeItems:'left'}}>
          <input type="radio" className='radio' name="media" id="mediayes" value={1} />
          <label htmlFor="mediayes" style={{width:'auto', flexGrow:'1'}}>📸 Yes, I give permission for my student to appear in media by RISE Youth and the church.</label>
        </div>
        <div style={{placeItems:'left'}}>
          <input type="radio" className='radio' name="media" id="mediano" value={0} />
          <label htmlFor="mediano" style={{width:'auto', flexGrow:'1'}}>🚫 No, please do not use photos or videos of my student.</label>
        </div>
        <br />
        <input type="submit" value="Submit"></input>
        <br />
      </form>
    </>
  }

  function MainContent() {
    if (tab == 3) return <section className="maincontent"><h2>{loadMessage}</h2></section>

    if (KEY.length != 60) {
      return (
        <section className="maincontent">
          <h2>Login</h2>
          <Login />
        </section>
      )
    }

    switch (tab) {
      case 0:
        return (
          <section className="maincontent">
            <h2>Members</h2>
            <Members />
          </section>
        )
      case 1:
        return (
          <section className="maincontent">
            <h2>Events</h2>
            <Events />
          </section>
        )
      case 2:
        return (
          <section className="maincontent">
            <h2>Edit Member</h2>
            <EditMember />
          </section>
        )
      case 4:
        return (
          <section className="maincontent">
            <h2>New Member</h2>
            <NewMember />
          </section>
        )
    }
  }

  return (
    <>
      <section id="center">
        <div id="titlebar">
          <h1>RISE</h1>
        </div>
        <MainContent />
        <nav id="footermenu">
          <ul id="footertabs">
            <li>
              <TabButton text="Members" tabid={0} />
            </li>
            <li>
              <TabButton text="Events" tabid={1} />
            </li>
          </ul>
        </nav>
      </section>
    </>
  )
}