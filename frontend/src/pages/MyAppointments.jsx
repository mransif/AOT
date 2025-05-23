import StyledButton from '@/components/StyledButton'
import StyledPayButton from '@/components/StyledPayButton'
import { AppContext } from '@/context/AppContext'
import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

const MyAppointments = () => {

  const { backendurl, token, getDoctorsData } = useContext(AppContext)

  const [appointments, setAppointments] = useState([])
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const navigate = useNavigate()

  const slotDateFormat = (slotDate) => {
    const dateArray = slotDate.split('_')
    return dateArray[0] + " " + months[Number(dateArray[1]) - 1] + " " + dateArray[2];
  }

  const getUserAppointments = async () => {
    try {
      const { data } = await axios.get(backendurl + '/api/user/appointments', { headers: { token } })

      if (data.succes) {
        setAppointments(data.appointments.reverse())
        console.log("appointments:", data.appointments)
      }

    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const cancelAppointment = async (appointmentId) => {

    try {

      const { data } = await axios.post(backendurl + '/api/user/cancel-appointment', { appointmentId }, { headers: { token } })

      if (data.success) {
        toast.success(data.message)
        getUserAppointments()
        getDoctorsData()
      }
      else {
        toast.error(data.message)
      }

    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const initPay = (order) => {

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'Appointment payment',
      description: 'Appointment payment',
      order_id: order.id,
      receipt: order.receipt,
      handler: async (response) => {
        console.log(response)

        try {

          const { data } = await axios.post(backendurl + '/api/user/verifyRazorpay', response, { headers: { token } })

          if (data.success) {
            getUserAppointments()
            navigate('/my-appointments')
          }

        } catch (error) {
          console.log(error)
          toast.error(error.message)
        }
      }
    }

    const rzp = new window.Razorpay(options)
    rzp.open()

  }



  const appointmentRazorpay = async (appointmentId) => {
    try {
      const { data } = await axios.post(backendurl + '/api/user/payment-razorpay', { appointmentId }, { headers: { token } })

      if (data.success) {
        initPay(data.order)

      }

    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }

  }

  useEffect(() => {
    if (token) {
      getUserAppointments()
    }
  }, [token])



  return (
    <div className='min-h-screen'>
      <p className='pb-3 mt-12 font-medium text-zinc-700 border-b'>My Appointments</p>
      <div className="h-auto mb-4">
        {appointments.map((item, index) => (
          <div className="grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-2 border-b" key={index}>
            <div>
              <img className='w-32 bg-indigo-50 rounded-md' src={item.docData.image} alt="" />
            </div>
            <div className='flex-1 text-sm text-zinc-600'>
              <p className='text-neutral-800 font-semibold'>{item.docData.name}</p>
              <p>{item.docData.speciality}</p>
              <p className='text-zinc-700 font-medium mt-1'>Address:</p>
              <p className='text-xs'>{item.docData.address.line1}</p>
              <p className='text-xs'>{item.docData.address.line2}</p>
              <p className='text-sm mt-1'><span className='text-sm text-neutral-700 font-medium'>Date & Time: </span>{slotDateFormat(item.slotDate)} | {item.slotTime}</p>
            </div>
            <div className="flex flex-col gap-2 justify-center ">
              {!item.cancelled && item.payment && <button className='text-center px-4 py-1 text-blue-500  rounded-lg border border-blue-400'>Paid</button>}

              {!item.cancelled && !item.isCompleted && !item.payment &&
              <p onClick={() => appointmentRazorpay(item._id)}>

                  <StyledPayButton className="p-[2px] ">
                  </StyledPayButton>
              </p>
              }

              {!item.cancelled && !item.isCompleted &&
                <p onClick={() => cancelAppointment(item._id)}>
                  <StyledButton className="">
                  </StyledButton>
                </p>
              }
              {item.cancelled && !item.isCompleted && <div className=' text-red-400 text-center px-4 py-1 rounded-lg border border-red-400'>Cancelled</div>}
              {item.isCompleted && <button className='text-center px-4 py-1 text-green-500  rounded-lg border border-green-400'>Completed</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MyAppointments