import { ItemModel } from "@/models/itemModel"
import Dialog from "@mui/material/Dialog"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import DialogContentText from "@mui/material/DialogContentText"
import DialogTitle from "@mui/material/DialogTitle"
import axios from "axios"
import { Dispatch, SetStateAction, useState } from "react"

export function UpdateItemDialog({
  open,
  setOpen,
  item,
  updatePage,
}: {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  item: ItemModel
  updatePage: any
}) {
  const [inputfields, setInputFields] = useState({
    id: item.id,
    name: item.name,
    desc: item.desc,
    imgUrl: item.imgUrl,
    price: item.price,
    gst: item.gst,
  })
  const handleClose = () => {
    setOpen(false)
  }

  async function updateItems() {
    if (!process.env.NEXT_PUBLIC_SERVER_URL) throw "Server Url Not Set"
    const url = process.env.NEXT_PUBLIC_SERVER_URL + "/admin/updateItem"

    try {
      var res = await axios.post(url, inputfields, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("Token")}`,
        },
      })

      if (res.status === 200) {
        alert("Items updated successfully")
      }
    } catch (e: any) {}

    updatePage()
    setOpen(false)
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Update Items</DialogTitle>
      <DialogContent>
        <div className="flex flex-col w-96">
          <div className="pl-1 pb-1 text-black font-bold">Name</div>
          <input
            className="p-2 px-5 border border-cbluel rounded-lg focus:border-cblue focus:border-2"
            type="text"
            value={inputfields.name}
            // placeholder={item.name}
            onChange={(e) =>
              setInputFields((f) => ({ ...f, name: e.target.value }))
            }
          />

          <div className="h-4" />
          <div className="pl-1 pb-1 text-black font-bold">Description</div>
          <input
            className="p-2 px-5 border border-cbluel rounded-lg focus:border-cblue focus:border-2"
            type="text"
            value={inputfields.desc}
            // placeholder={item.desc}
            onChange={(e) =>
              setInputFields((f) => ({ ...f, desc: e.target.value }))
            }
          />

          <div className="h-4" />
          <div className="pl-1 pb-1 text-black font-bold">Image URL</div>
          <input
            className="p-2 px-5 border border-cbluel rounded-lg focus:border-cblue focus:border-2"
            type="text"
            value={inputfields.imgUrl}
            // placeholder={item.imgUrl}
            onChange={(e) =>
              setInputFields((f) => ({ ...f, imgUrl: e.target.value }))
            }
          />

          <div className="h-4" />
          <div className="pl-1 pb-1 text-black font-bold">Price</div>
          <input
            className="p-2 px-5 border border-cbluel rounded-lg focus:border-cblue focus:border-2"
            type="text"
            // value={inputfields.price.toString()}
            placeholder={item.price.toString()}
            onChange={(e) =>
              setInputFields((f) => ({
                ...f,
                price: parseFloat(e.target.value),
              }))
            }
          />

          <div className="h-4" />
          <div className="pl-1 pb-1 text-black font-bold">GST</div>
          <input
            className="p-2 px-5 border border-cbluel rounded-lg focus:border-cblue focus:border-2"
            type="text"
            // value={inputfields.gst.toString()}
            placeholder={item.gst.toString()}
            onChange={(e) =>
              setInputFields((f) => ({ ...f, gst: parseFloat(e.target.value) }))
            }
          />
        </div>
      </DialogContent>
      <DialogActions>
        <button
          className="p-2 px-4 text-cblue border border-cblue bg-transparent rounded-md hover:border hover:border-cbluel hover:text-white hover:bg-cbluel"
          onClick={handleClose}>
          Cancel
        </button>
        <div className="w-2" />
        <button
          className="p-2 px-4 text-white border border-cblue bg-cblue rounded-md hover:border hover:border-white hover:text-white hover:bg-cbluel"
          onClick={updateItems}>
          Update
        </button>
      </DialogActions>
    </Dialog>
  )
}
