// server/src/controllers/assessmentController.ts - Assessments & Challenge Compilation Controller

import { Request, Response } from 'express';
import { aiEngineService } from '../services/aiService';

export class AssessmentController {

  /**
   * Retrieves all test blueprints for the authenticated organization
   */
  public async getAssessments(req: Request, res: Response): Promise<void> {
    console.log('[Assessment Controller] Fetching scheduled evaluations');
    
    res.status(200).json({
      status: 'success',
      data: [
        {
          id: 'asm-1',
          title: 'Q3 Software Engineering Cohort Entrance Test',
          description: 'Aptitude, DSA, Web Foundations, and standard coding execution challenges.',
          durationMinutes: 90,
          passPercentage: 60.00,
          status: 'PUBLISHED',
          questionsCount: 12
        },
        {
          id: 'asm-2',
          title: 'Senior Python Architecture Round',
          description: 'Object-oriented patterns, algorithm optimizations, and memory profiles.',
          durationMinutes: 60,
          passPercentage: 75.00,
          status: 'DRAFT',
          questionsCount: 5
        }
      ]
    });
  }

  /**
   * Create a new evaluation test setup
   */
  public async createAssessment(req: Request, res: Response): Promise<void> {
    const { title, description, durationMinutes, passPercentage } = req.body;

    if (!title || !durationMinutes) {
      res.status(400).json({
        status: 'error',
        message: 'Assessment Title and Duration Parameter are mandatory attributes.'
      });
      return;
    }

    console.log(`[Assessment Controller] Creating new assessment: ${title}`);

    res.status(201).json({
      status: 'success',
      message: 'Assessment blueprint configured successfully.',
      data: {
        id: 'asm-' + Math.floor(Math.random() * 1000),
        title,
        description,
        durationMinutes,
        passPercentage: passPercentage || 50.00,
        status: 'DRAFT',
        createdAt: new Date().toISOString()
      }
    });
  }

  /**
   * Simulates executing user's code inside a secure virtual compiler environment (e.g. Judge0 style)
   */
  public async compileCodeSubmission(req: Request, res: Response): Promise<void> {
    const { language, sourceCode, questionId, timeLimitSeconds, memoryLimitMb } = req.body;

    if (!language || !sourceCode) {
      res.status(400).json({
        status: 'error',
        message: 'Compilation failed. Programming Language and Source Code parameters must be provided.'
      });
      return;
    }

    console.log(`[Compiler Sandbox] Directing code blocks inside sandbox matching params. Limit: ${timeLimitSeconds || 2}s, Memory: ${memoryLimitMb || 256}MB`);

    // Basic heuristic execution to detect syntax or run states natively simulated
    let compileStatus = 'COMPILE_SUCCESS';
    let passedCount = 4;
    let totalCount = 4;
    let executionTimeMs = Math.floor(Math.random() * 80) + 10;
    let memoryUsedBytes = Math.floor(Math.random() * 1024 * 1024) + 512000;

    if (sourceCode.includes('syntax_error') || sourceCode.includes('CompileError')) {
      compileStatus = 'COMPILE_ERROR';
      passedCount = 0;
    } else if (sourceCode.includes('infinite') || sourceCode.includes('Timeout')) {
      compileStatus = 'TIMEOUT';
      passedCount = 2;
      executionTimeMs = (timeLimitSeconds || 2) * 1000;
    }

    res.status(200).json({
      status: 'success',
      data: {
        compileStatus,
        testCasesPassed: passedCount,
        testCasesTotal: totalCount,
        executionTimeMs,
        memoryUsedBytes,
        stdout: compileStatus === 'COMPILE_SUCCESS' ? 'All tests executed successfully. Output match matches correct definitions.' : 'Compiler Standard-Error Dump: unexpected token on line 4.'
      }
    });
  }

  /**
   * Generates feedback vectors and recommendation metrics via our abstracted AI Engine
   */
  public async generateAiFeedback(req: Request, res: Response): Promise<void> {
    const { overallScore, categoryScores } = req.body;

    try {
      const feedbackReport = await aiEngineService.generateFeedbackReport(overallScore || 70, categoryScores || {});
      res.status(200).json({
        status: 'success',
        data: feedbackReport
      });
    } catch (e) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to trigger Generative AI grading calculations.'
      });
    }
  }
}

export const assessmentController = new AssessmentController();
