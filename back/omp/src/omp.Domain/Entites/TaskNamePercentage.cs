namespace omp.Domain.Entites
{
    public static class TaskNamePercentage
    {
        public static readonly Dictionary<Nature, Dictionary<TaskName, double>> Percentages = new()
        {
            [Nature.AMI] = new Dictionary<TaskName, double>
            {
                [TaskName.WhyEY] = 15,
                [TaskName.Contexte] = 15,
                [TaskName.References] = 35,
                [TaskName.Cvs] = 35
            },
            [Nature.Propale] = new Dictionary<TaskName, double>
            {
                [TaskName.WhyEY] = 10,
                [TaskName.References] = 15,
                [TaskName.CommentairesAuxTDR] = 10,
                [TaskName.Contexte] = 10,
                [TaskName.Methodologie] = 25,
                [TaskName.Planning] = 15,
                [TaskName.Cvs] = 15
            }
        };
    }
}
