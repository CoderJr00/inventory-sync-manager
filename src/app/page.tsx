import TableExportRow from "./components/TableExportRow";
import TableUploadRow from "./components/TableUploadRow";

export default async function page() {
  return (
    <section className="flex flex-col min-h-screen text-base">
      <TableUploadRow/>
    </section>
  )

}