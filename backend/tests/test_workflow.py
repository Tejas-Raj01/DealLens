from app.services.workflow_engine import DealLensWorkflowEngine


def test_workflow_dag_steps_order():
    engine = DealLensWorkflowEngine()
    assert len(engine.STEPS_DAG) == 7
    assert engine.STEPS_DAG[0] == "document_validation"
    assert engine.STEPS_DAG[-1] == "report_generation"
