import React, { useState, useEffect } from 'react';
import { Play, Square, Pause, Calendar, Clock, CheckCircle2, AlertCircle, TrendingUp, Users } from 'lucide-react';

const ProductionCycleManager = () => {
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [currentActivities, setCurrentActivities] = useState(null);

  useEffect(() => {
    fetchProductionCycles();
  }, []);

  const fetchProductionCycles = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/production-cycles', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('donatrakAccessToken')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setCycles(result.data || []);
      } else {
        console.error('Failed to fetch production cycles');
        setCycles([]);
      }
    } catch (error) {
      console.error('Error fetching production cycles:', error);
      setCycles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentActivities = async (cycleId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/production-cycles/${cycleId}/current-activities`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('donatrakAccessToken')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setCurrentActivities(result.data);
      } else {
        console.error('Failed to fetch current activities');
      }
    } catch (error) {
      console.error('Error fetching current activities:', error);
    }
  };

  const updateCycleStatus = async (cycleId, status, additionalData = {}) => {
    try {
      const response = await fetch(`http://localhost:3001/api/production-cycles/${cycleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('donatrakAccessToken')}`
        },
        body: JSON.stringify({ status, ...additionalData })
      });

      if (response.ok) {
        const result = await response.json();
        // Update local state
        setCycles(cycles.map(cycle => 
          cycle.id === cycleId ? result.data : cycle
        ));
        return true;
      } else {
        console.error('Failed to update cycle status');
        return false;
      }
    } catch (error) {
      console.error('Error updating cycle status:', error);
      return false;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <Play className="h-5 w-5 text-green-600" />;
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-blue-600" />;
      case 'paused':
        return <Pause className="h-5 w-5 text-yellow-600" />;
      default:
        return <Square className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800 border-green-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200',
      paused: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown'}
      </span>
    );
  };

  const getProgressColor = (percent) => {
    if (percent >= 80) return 'text-blue-600';
    if (percent >= 50) return 'text-green-600';
    if (percent >= 25) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysRemaining = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const selectCycle = (cycle) => {
    setSelectedCycle(cycle);
    if (cycle) {
      fetchCurrentActivities(cycle.id);
    } else {
      setCurrentActivities(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Production Cycle Management</h2>
        <p className="text-gray-600">
          Monitor and manage your active poultry production cycles.
        </p>
      </div>

      {cycles.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Cycles</h3>
          <p className="text-gray-500">
            Start your first production cycle from a calendar template to begin tracking.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cycles List */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 mb-4">Your Production Cycles</h3>
            {cycles.map((cycle) => (
              <div 
                key={cycle.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedCycle?.id === cycle.id 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => selectCycle(cycle)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(cycle.status)}
                    <h4 className="font-medium text-gray-900">{cycle.batchName}</h4>
                  </div>
                  {getStatusBadge(cycle.status)}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span className="capitalize">{cycle.commodity}</span>
                    <span>Week {cycle.currentWeek} of {cycle.totalDurationWeeks}</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        cycle.progressPercent >= 100 ? 'bg-blue-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(100, cycle.progressPercent || 0)}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Started: {formatDate(cycle.startDate)}</span>
                    <span className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {cycle.currentQuantity}/{cycle.initialQuantity}
                    </span>
                  </div>
                  
                  {cycle.status === 'active' && (
                    <div className="text-xs text-gray-500">
                      {getDaysRemaining(cycle.expectedEndDate)} days remaining
                    </div>
                  )}
                </div>
                
                <div className="mt-3 flex space-x-2">
                  {cycle.status === 'active' && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateCycleStatus(cycle.id, 'paused');
                        }}
                        className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded hover:bg-yellow-200 transition-colors"
                      >
                        Pause
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Mark this cycle as completed?')) {
                            updateCycleStatus(cycle.id, 'completed');
                          }
                        }}
                        className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 transition-colors"
                      >
                        Complete
                      </button>
                    </>
                  )}
                  
                  {cycle.status === 'paused' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateCycleStatus(cycle.id, 'active');
                      }}
                      className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded hover:bg-green-200 transition-colors"
                    >
                      Resume
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Cycle Details and Current Activities */}
          <div>
            {selectedCycle ? (
              <div className="space-y-6">
                {/* Cycle Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Cycle Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Batch Name:</span>
                      <p className="text-gray-900">{selectedCycle.batchName}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Commodity:</span>
                      <p className="text-gray-900 capitalize">{selectedCycle.commodity}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Start Date:</span>
                      <p className="text-gray-900">{formatDate(selectedCycle.startDate)}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Expected End:</span>
                      <p className="text-gray-900">{formatDate(selectedCycle.expectedEndDate)}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Initial Quantity:</span>
                      <p className="text-gray-900">{selectedCycle.initialQuantity}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Current Quantity:</span>
                      <p className="text-gray-900">{selectedCycle.currentQuantity}</p>
                    </div>
                  </div>
                  
                  {selectedCycle.notes && (
                    <div className="mt-4">
                      <span className="font-medium text-gray-700">Notes:</span>
                      <p className="text-gray-900 text-sm mt-1">{selectedCycle.notes}</p>
                    </div>
                  )}
                </div>

                {/* Current Week Activities */}
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-green-600" />
                    This Week's Activities
                    {currentActivities && (
                      <span className="ml-2 text-sm text-gray-500">
                        (Week {currentActivities.currentWeek})
                      </span>
                    )}
                  </h3>
                  
                  {currentActivities ? (
                    <div className="space-y-3">
                      {currentActivities.activities && currentActivities.activities.length > 0 ? (
                        currentActivities.activities.map((activity, index) => {
                          const isCompleted = currentActivities.completedActivities?.includes(activity.activityId);
                          
                          return (
                            <div key={index} className={`flex items-start space-x-3 p-3 rounded-lg ${
                              isCompleted ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                            }`}>
                              <div className="flex-shrink-0 mt-0.5">
                                {isCompleted ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                                ) : (
                                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{activity.activityName}</h4>
                                {activity.periods && activity.periods.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {activity.periods.map((period, pidx) => (
                                      <span key={pidx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                        Week {period.productionWeek}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8">
                          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500">No specific activities for this week</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="animate-pulse space-y-2">
                      <div className="h-12 bg-gray-200 rounded"></div>
                      <div className="h-12 bg-gray-200 rounded"></div>
                    </div>
                  )}
                </div>

                {/* Progress Metrics */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                    Progress Metrics
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getProgressColor(selectedCycle.progressPercent)}`}>
                        {Math.round(selectedCycle.progressPercent || 0)}%
                      </div>
                      <p className="text-gray-600">Completion</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {selectedCycle.currentWeek}/{selectedCycle.totalDurationWeeks}
                      </div>
                      <p className="text-gray-600">Weeks</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Cycle</h3>
                <p className="text-gray-500">
                  Click on a production cycle to view details and current activities.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionCycleManager;