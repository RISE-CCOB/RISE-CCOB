import { useState, useEffect, useRef } from 'react'
import './App.css'

export default function App() {
  const URL = "https://script.google.com/macros/s/AKfycby9u2qjfcaTjGRt9zEbS59Fz5amqCJW4766RNZopVbpAGSG7kxSRsM3eYad-Faa5eNG/exec"

  const [tab, setTab] = useState(0)

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
  


  async function getMemberData() {
    try {
      setLoadingMembers(true)
      console.log("Fetching Members...")
      const response = await fetch(URL + "?action=getMembers")
      const result = await response.json()
      setMemberData(result)
    } catch (e) {}
    
    setLoadingMembers(false)
  }
  
  async function updateMember(e) {
    e.preventDefault();
    setTab(3)

    try {
      console.log("Updating Member...")
      const data = new FormData(e.target)
      const values = Object.fromEntries(data.entries())
      const params = new URLSearchParams()
      params.append("action", "updateMember")
      params.append("id", viewedMember[0])
      params.append("fname", values.fname)
      params.append("lname", values.lname)
      params.append("phone", values.phone)
      params.append("email", values.email)
      console.log(URL + "?" + params)
      const response = await fetch(URL + "?" + params)
      const result = await response.json()
      setMemberData(result)
    } catch (e) {}

    setTab(0)
  }

  async function createNewMember(e) {
    e.preventDefault();
    setTab(3)

    try {
      console.log("Creating Member...")
      const data = new FormData(e.target)
      const values = Object.fromEntries(data.entries())
      const params = new URLSearchParams()
      params.append("action", "createMember")
      params.append("fname", values.fname)
      params.append("lname", values.lname)
      params.append("phone", values.phone)
      params.append("email", values.email)
      console.log(URL + "?" + params)
      const response = await fetch(URL + "?" + params)
      const result = await response.json()
      setMemberData(result)
    } catch (e) {}

    setTab(0)
  }

  async function getEventData() {
    try {
      setLoadingEvents(true)
      console.log("Fetching Events...")
      const response = await fetch(URL + "?action=getEvents")
      const result = await response.json()
      setEventData(result)
    } catch (e) {}

    setLoadingEvents(false)
  }

  async function getAttendanceData() {
    try {
      setLoadingAttendance(true)
      console.log("Fetching Attendance...")
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
      <p style={{flexGrow:1, textAlign:'left'}}>{member[1]} {member[2]}</p>
      <div>
        <p>{member[3]}</p>
        <p>{member[4]}</p>
      </div>
    </button>)
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
          if (memberData[j][1] < memberData[i][1]) {
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
          if (memberData[j][2] < memberData[i][2]) {
            let temp = memberData[j]
            memberData[j] = memberData[i]
            memberData[i] = temp
          }
        }
      }
    }

    for (let row of memberData) {
      view.push(<MemberCard member={row} key={row[0]} />)
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
        <div>
          <label htmlFor="fname">First Name</label>
          <input type="text" name="fname" defaultValue={viewedMember[1]}></input>
        </div>
        <div>
          <label htmlFor="lname">Last Name</label>
          <input type="text" name="lname" defaultValue={viewedMember[2]}></input>
        </div>
        <div>
          <label htmlFor="phone">Phone #</label>
          <input type="text" name="phone" defaultValue={viewedMember[3]}></input>
        </div>
        <div>
          <label htmlFor="email">Email</label>
          <input type="text" name="email" defaultValue={viewedMember[4]}></input>
        </div>
        <input type="submit" value="Update"></input>
      </form>
    </>
  }

  // New Member view
  function NewMember({}) {
    return <>
      <form onSubmit={(e) => createNewMember(e)}>
        <div>
          <label htmlFor="fname">First Name</label>
          <input type="text" name="fname"></input>
        </div>
        <div>
          <label htmlFor="lname">Last Name</label>
          <input type="text" name="lname"></input>
        </div>
        <div>
          <label htmlFor="phone">Phone #</label>
          <input type="text" name="phone"></input>
        </div>
        <div>
          <label htmlFor="email">Email</label>
          <input type="text" name="email"></input>
        </div>
        <input type="submit" value="Create"></input>
      </form>
    </>
  }

  function MainContent() {
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
      case 3:
        return <section className="maincontent"><h2>Updating...</h2></section>
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