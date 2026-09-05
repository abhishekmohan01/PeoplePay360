import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { Employee } from '../../api/employees';
import './EmployeeCard.css';

export const EmployeeCard = ({ employee }: { employee: Employee }) => {
  const navigate = useNavigate();

  return (
    <Card 
      className="emp-card" 
      onClick={() => navigate(`/employees/${employee.id}`)}
      role="button"
      tabIndex={0}
    >
      <div className="emp-card-header">
        <Avatar name={employee.name} size="md" />
        <div className="emp-card-info">
          <h3>{employee.name}</h3>
          <p>{employee.jobPosition}</p>
        </div>
      </div>
      
      <div className="emp-card-body">
        <div className="emp-meta">
          <span className="emp-meta-label">Dept:</span>
          <span>{employee.department}</span>
        </div>
      </div>

      <div className="emp-card-footer">
        <StatusBadge status={employee.status} />
      </div>
    </Card>
  );
};
