// joanne's file pls ignore muna

import { supabase } from "@/lib/supabase";

export default async function Home() {
    
    const { data, error } = await supabase.from("sample").select('*')

     if (error) {
    console.error("Error fetching data:", error.message)
    return <p className="text-red-500">Error: {error.message}</p>
    }

    if (!data || data.length === 0) {
        return <p>No data found in the "sample" table.</p>
    }

    return (
        <div className="p-4">
        <h1 className="text-xl font-bold mb-4">Sample Data</h1>
        <ul className="space-y-2">
            {data.map((item, index) => (
            <li key={index} className="p-2 border rounded">
                {JSON.stringify(item, null, 2)}
            </li>
            ))}
        </ul>
        </div>
    )

    // if (data) console.log(data)
    // if (error) console.log(error)
    // }

    // setNewView()
    // return (
        
    // )
    
}