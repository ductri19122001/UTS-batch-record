import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { useNavigate } from 'react-router-dom';
import { ClipboardPlus, PencilIcon, PersonStanding, Sheet } from 'lucide-react';
import { useUserRoles } from '../hooks/useUserRoles';



const Home = () => {
  const navigate = useNavigate();
  const { hasAnyRole } = useUserRoles();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="container mx-auto px-6 pt-16 pb-10">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            NepBio Batch Records System
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Online Batch Record Management System
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-5">
          <button onClick={() => navigate("/records")}>
            <Card className="hover:scale-105 transition-all duration-300 border-0 shadow-md bg-white/80 backdrop-blur-md">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <Sheet />
                  </svg>
                </div>
                <CardTitle className="text-xl text-gray-800">Batch Records</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-gray-600 leading-relaxed">
                  Access and edit previously started batch records or create a new one!
                </CardDescription>
              </CardContent>
            </Card>
          </button>
          {hasAnyRole(['QA', 'ADMIN', 'QC', 'USER']) && (
            <button onClick={() => navigate("/products")}>
              <Card className="hover:scale-105 transition-all duration-300 border-0 shadow-md bg-white/80 backdrop-blur-sm">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <ClipboardPlus />
                    </svg>
                  </div>
                  <CardTitle className="text-xl text-gray-800">Products</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-gray-600 leading-relaxed">
                    View products currently in production
                  </CardDescription>
                </CardContent>
              </Card>
            </button>
          )}
          {hasAnyRole(['QA', 'ADMIN', 'QC']) && (
            <button onClick={() => navigate("/templates")}>
              <Card className="hover:scale-105 transition-all duration-300 border-0 shadow-md bg-white/80 backdrop-blur-sm">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <PencilIcon />
                    </svg>
                  </div>
                  <CardTitle className="text-xl text-gray-800">Templates</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-gray-600 leading-relaxed">
                    view and edit batch record templates
                  </CardDescription>
                </CardContent>
              </Card>
            </button>
          )}
          {hasAnyRole(['ADMIN']) && (
            <button onClick={() => navigate("/users")}>
              <Card className="hover:scale-105 transition-all duration-300 border-0 shadow-md bg-white/80 backdrop-blur-sm">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <PersonStanding />
                    </svg>
                  </div>
                  <CardTitle className="text-xl text-gray-800">Users</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-gray-600 leading-relaxed">
                    Manage Users
                  </CardDescription>
                </CardContent>
              </Card>
            </button>
          )}

        </div>
      </div>
    </div>
  )
}

export default Home
