import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";


const AdminUserDashboard = () => {
  return (
    <div className="p-10">
      <Card>
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
          <CardDescription>View and update users</CardDescription>
        </CardHeader>
        <CardContent>
          <div>Hello World</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUserDashboard;
