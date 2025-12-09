import { useAuth0 } from '@auth0/auth0-react'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from './ui/button'

const UserDashboard = () => {

    const {logout} = useAuth0()



    return (
        <div className='p-10'>
            <Card>
                <CardHeader>
                    <CardTitle>User Profile</CardTitle>
                    <CardDescription>View and update your profile</CardDescription>
                </CardHeader>
                <CardContent>
                    <div>
                        Hello World
                    </div>

                    <div>
                        <Button onClick={() => logout({
                      logoutParams: {
                        returnTo: window.location.origin
                      }
                    })}>Logout</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default UserDashboard